class DwHotspotJob {
  constructor(prisma) {
    this._prisma = prisma;
  }

  async updateDimTime() {
    const result = await this._prisma.$executeRaw`
        INSERT INTO dim_time(id_time, tahun, semester, kuartal, bulan, minggu, hari)
        SELECT (h.hs_id AT TIME ZONE 'Asia/Jakarta')::date AS id_time,
                EXTRACT(YEAR FROM (h.hs_id AT TIME ZONE 'Asia/Jakarta')::date) AS tahun,
        CASE
          WHEN EXTRACT(MONTH FROM (h.hs_id AT TIME ZONE 'Asia/Jakarta')::date) <= 6 THEN 1
          ELSE 2
        END AS semester,
        CONCAT('Q', CEIL(EXTRACT(MONTH FROM (h.hs_id AT TIME ZONE 'Asia/Jakarta')::date) / 3.0)) AS kuartal,
        CASE EXTRACT(MONTH FROM (h.hs_id AT TIME ZONE 'Asia/Jakarta')::date)
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
          WHEN EXTRACT(WEEK FROM (h.hs_id AT TIME ZONE 'Asia/Jakarta')::date) <= 4 THEN EXTRACT(WEEK FROM (h.hs_id AT TIME ZONE 'Asia/Jakarta')::date)
        ELSE 4
        END AS minggu,
        CASE EXTRACT(DOW FROM (h.hs_id AT TIME ZONE 'Asia/Jakarta')::date)
          WHEN 0 THEN 'Minggu'
          WHEN 1 THEN 'Senin'
          WHEN 2 THEN 'Selasa'
          WHEN 3 THEN 'Rabu'
          WHEN 4 THEN 'Kamis'
          WHEN 5 THEN 'Jumat'
          WHEN 6 THEN 'Sabtu'
        END AS hari
        FROM hotspot_sipongi h
        EXCEPT
        SELECT id_time, tahun, semester, kuartal, bulan, minggu, hari 
        FROM dim_time
        -- WHERE NOT EXISTS (
        --     SELECT id_time FROM dim_time
        --     WHERE id_time = (h.hs_id)::date -- Kolom yang dijadikan unik
        -- );
    `;
    console.log(">>> Update dimensi time berhasil :", result);
  }

  async updateDimConfidence() {
    const result = await this._prisma.$executeRaw`
        INSERT INTO dim_confidence(confidence_level)
        SELECT DISTINCT h.confidence_level AS confidence_level FROM hotspot_sipongi h
        WHERE NOT EXISTS (
        SELECT confidence_level FROM dim_confidence
        WHERE confidence_level = confidence_level -- Kolom yang dijadikan unik
        );
    `;
    console.log(">>> Update dimensi confidence berhasil :", result);
  }

  async updateDimLocation() {
    const result = await this._prisma.$executeRaw`
        INSERT INTO dim_location(pulau, provinsi, kab_kota, kecamatan, desa, geom_desa)
        SELECT wadmkd AS desa,
                wadmkc AS kecamatan,
                wadmkk AS kab_kota,
                wadmpr AS provinsi,
                CASE
                  WHEN wadmpr LIKE '%Sumatera%' THEN 'Sumatera'
                  WHEN wadmpr LIKE '%Jawa%' THEN 'Jawa'
                  WHEN wadmpr LIKE '%Sulawesi%' THEN 'Sulawesi'
                  WHEN wadmpr LIKE '%Papua%' THEN 'Papua'
                  WHEN wadmpr LIKE '%Lampung%' THEN 'Sumatera'
                  WHEN wadmpr LIKE '%Aceh%' THEN 'Sumatera'
                  WHEN wadmpr LIKE '%Bangka%' THEN 'Sumatera'
                  WHEN wadmpr LIKE '%Bengkulu%' THEN 'Sumatera'
                  WHEN wadmpr LIKE '%Riau%' THEN 'Sumatera'
                  WHEN wadmpr LIKE '%Jambi%' THEN 'Sumatera'
                  WHEN wadmpr LIKE '%Nusa%' THEN 'Nusa Tenggara'
                  WHEN wadmpr LIKE '%Bali%' THEN 'Bali'
                  WHEN wadmpr LIKE '%Maluku%' THEN 'Maluku'
                  WHEN wadmpr LIKE '%Gorontalo%' THEN 'Sulawesi'
                  WHEN wadmpr LIKE '%Yogyakarta%' THEN 'Jawa'
                  WHEN wadmpr LIKE '%Banten%' THEN 'Jawa'
                  WHEN wadmpr LIKE '%Jakarta%' THEN 'Jawa'
                  WHEN wadmpr LIKE '%Kalimantan%' THEN 'Kalimantan'
                END AS pulau,
                geom AS geom_desa
          FROM batas_desa_big_2020
          EXCEPT
          SELECT pulau, provinsi, kab_kota, kecamatan, desa, geom_desa
          FROM dim_location
    `;
    console.log(">>> Update dimensi confidence berhasil :", result);
  }

  async updateDimSatelite() {
    const result = await this._prisma.$executeRaw`
        INSERT INTO dim_satelite(satelite_name)
        SELECT DISTINCT sumber FROM hotspot_sipongi
        WHERE NOT EXISTS (
        SELECT satelite_name FROM dim_satelite
        WHERE satelite_name = sumber -- Kolom yang dijadikan unik
        );
    `;
    console.log(">>> Update dimensi satelite berhasil :", result);
  }

  async updateFactHotspot() {
    const result = await this._prisma.$executeRaw`
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
        EXCEPT 
        SELECT id_time, id_location, id_satelite, id_confidence, hotspot_count
        FROM fact_hotspot
    `;
    console.log(">>> Update tabel fakta hotspot berhasil :", result);
  }
}

module.exports = DwHotspotJob;
