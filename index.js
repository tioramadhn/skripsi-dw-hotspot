const { PrismaClient } = require("@prisma/client");
const cron = require("node-cron");
const { default: axios } = require("axios");
const prisma = new PrismaClient();
const dayjs = require("dayjs");
require("dayjs/locale/id"); // Impor lokal bahasa Indonesia
const utc = require("dayjs/plugin/utc"); // Impor plugin UTC

dayjs.extend(utc); // Menambahkan plugin UTC ke dayjs
dayjs.locale("id"); // Setel bahasa ke Indonesia

const getDate = () => {
  const timestamp = Date.now();
  // const timestamp = new Date("2023-5-28");
  const dateObj = dayjs(timestamp).utcOffset("+07:00"); // Mengatur offset zona waktu untuk WIB
  return dateObj.format("YYYY-MM-DD");
};

const setAndGetURL = (date, from, to) => {
  const FROM = date || from;
  const TO = date || to;
  return `https://sipongi.menlhk.go.id/api/opsroom/indoHotspot?wilayah=IN&filterperiode=true&from=${FROM}&to=${TO}&late=custom&satelit[]=LPN-MODIS&satelit[]=LPN-NPP&satelit[]=LPN-NOAA20&confidence[]=high&confidence[]=medium&confidence[]=low`;
};

const config = {
  scheduled: true,
  timezone: "Asia/Jakarta",
};

const getHotspot = async (url) => {
  try {
    const { data } = await axios.get(url);

    if (data.length === 0) {
      console.log("Data hotspot kosong");
    }

    return data.features.map((hotspot) => hotspot.properties);
  } catch (error) {
    console.log(error);
  }
};

const isUnique = async (hotspot) => {
  delete hotspot.desa_id;
  const result = await prisma.hotspot_sipongi.findMany({
    where: hotspot,
  });
  console.log(result.length);
  return result.length === 0;
};

const updateHotspotSipongi = (hotspots) => {
  hotspots.forEach(async (hotspot) => {
    if (await isUnique(hotspot)) {
      await prisma.hotspot_sipongi.create({
        data: hotspot,
      });
    }
  });
};

const updateDimConfidence = async () => {
  try {
    await prisma.$queryRaw`
      INSERT INTO dim_confidence(confidence_level)
      SELECT DISTINCT h.confidence_level AS confidence_level FROM hotspot_sipongi h
      WHERE NOT EXISTS (
        SELECT confidence_level FROM dim_confidence
        WHERE confidence_level = confidence_level -- Kolom yang dijadikan unik
      );
  `;
    console.log(">>> Update dimensi confidence berhasil");
  } catch (error) {
    console.log(error);
  }
};

const updateDimTime = async (time) => {
  try {
    await prisma.$queryRaw`
      INSERT INTO dim_time(id_time, tahun, semester, kuartal, bulan, minggu, hari)
      SELECT (${time})::date AS id_time,
              EXTRACT(YEAR FROM (${time})::date) AS tahun,
              CASE
      WHEN EXTRACT(MONTH FROM (${time})::date) <= 6 THEN 1
      ELSE 2
      END AS semester,
      CONCAT('Q', CEIL(EXTRACT(MONTH FROM (${time})::date) / 3.0)) AS kuartal,
      CASE EXTRACT(MONTH FROM (${time})::date)
        WHEN 1 THEN 'Januari'
        WHEN 2 THEN 'Februari'
        WHEN 3 THEN 'Maret'
        WHEN 4 THEN 'April'
        WHEN 5 THEN 'Mei'
        WHEN 6 THEN 'Juni'
        WHEN 7 THEN 'Juli'
        WHEN 8 THEN 'Agustus'
        WHEN 9 THEN 'September'
        WHEN 10 THEN 'Oktober'
        WHEN 11 THEN 'November'
        WHEN 12 THEN 'Desember'
      END AS bulan,
      CASE
        WHEN EXTRACT(WEEK FROM (${time})::date) <= 4 THEN EXTRACT(WEEK FROM (${time})::date)
        ELSE 4
      END AS minggu,
      CASE EXTRACT(DOW FROM (${time})::date)
        WHEN 0 THEN 'Minggu'
        WHEN 1 THEN 'Senin'
        WHEN 2 THEN 'Selasa'
        WHEN 3 THEN 'Rabu'
        WHEN 4 THEN 'Kamis'
        WHEN 5 THEN 'Jumat'
        WHEN 6 THEN 'Sabtu'
      END AS hari
      WHERE NOT EXISTS (
        SELECT id_time FROM dim_time
        WHERE id_time = (${time})::date -- Kolom yang dijadikan unik
      );
`;
    console.log(">>> Update dimensi time berhasil");
  } catch (error) {
    console.log(error);
  }
};

const updateDimSatelite = async () => {
  try {
    await prisma.$queryRaw`
      INSERT INTO dim_satelite(satelite_name)
      SELECT DISTINCT sumber FROM hotspot_sipongi
      WHERE NOT EXISTS (
        SELECT satelite_name FROM dim_satelite
        WHERE satelite_name = sumber -- Kolom yang dijadikan unik
      );
`;
    console.log(">>> Update dimensi satelite berhasil");
  } catch (error) {
    console.log(error);
  }
};

const updateFactHotspot = async () => {
  try {
    const result = await prisma.$queryRaw`
        INSERT INTO fact_hotspot(id_time, id_location, id_satelite, id_confidence, hotspot_count)
        SELECT  (t.id_time)::DATE AS id_time,
                l.id_location AS id_location,
                s.id_satelite AS id_satelite,
                c.id_confidence AS id_confidence,
                h.counter AS hotspot_count
        FROM hotspot_sipongi h
        JOIN dim_confidence c ON h.confidence_level = c.confidence_level
        JOIN dim_satelite s ON h.sumber = s.satelite_name  
        JOIN dim_time t ON (h.hs_id)::DATE = (t.id_time)::DATE
        JOIN dim_location l ON ST_WITHIN(ST_MakePoint((h.long)::double precision, (h.lat)::double precision), l.geom_desa)
        WHERE NOT EXISTS (
            SELECT * FROM fact_hotspot f
            WHERE f.id_location = l.id_location -- Kolom yang dijadikan unik
            AND f.id_time = (t.id_time)::DATE -- Kolom yang dijadikan unik
            AND f.id_satelite = s.id_satelite -- Kolom yang dijadikan unik
            AND f.id_confidence = c.id_confidence -- Kolom yang dijadikan unik
            AND f.hotspot_count = h.counter -- Kolom yang dijadikan unik
         );
    `;
    console.log(">>> Update tabel fakta hotspot berhasil");
  } catch (error) {
    console.log(error);
  }
};

// Modul ETL
const hotspotJob = async () => {
  console.log(`------ Memulai hotspot job ------`);
  const date = getDate();
  console.log("Tanggal :", date);
  const URL = setAndGetURL(date);
  const hotspot = await getHotspot(URL);

  // Modul Database Hotspot
  updateHotspotSipongi(hotspot);

  // Modul Datawarohouse hotspot
  updateDimTime(date);
  updateDimSatelite();
  updateDimConfidence();
  updateFactHotspot();
};
// detik(0-59) menit(0-59) jam(0-23) tanggal(1-31) bulan(1-12 or names) dow(0-7 or names)
cron.schedule("59 23 * * *", hotspotJob, config);
