class DwHotspotJob {
  constructor(prisma) {
    this._prisma = prisma;
  }

  async updateDimTime(time) {
    const result = await this._prisma.$executeRaw`
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
        WHERE NOT EXISTS (
            SELECT * FROM fact_hotspot f
            WHERE f.id_location = l.id_location -- Kolom yang dijadikan unik
            AND f.id_time = (t.id_time)::DATE -- Kolom yang dijadikan unik
            AND f.id_satelite = s.id_satelite -- Kolom yang dijadikan unik
            AND f.id_confidence = c.id_confidence -- Kolom yang dijadikan unik
            AND f.hotspot_count = h.counter -- Kolom yang dijadikan unik
         );
    `;
    console.log(">>> Update tabel fakta hotspot berhasil :", result);
  }
}

module.exports = DwHotspotJob;
