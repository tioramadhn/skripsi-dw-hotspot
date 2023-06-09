class DbHotspotJob {
  constructor(prisma) {
    this._prisma = prisma;
  }

  async updateHotspotSipongi(hotspots) {
    await this._prisma.$executeRaw`
        TRUNCATE TABLE temp_db_hotspot;
    `;

    await this._prisma.temp_db_hotspot.createMany({
      data: hotspots,
    });

    const result = await this._prisma.$executeRaw`
        INSERT INTO hotspot_sipongi(hs_id, date_hotspot_ori, provinsi_id, lat, long, sumber, ori_sumber, date_hotspot, desa_id,     counter, confidence, confidence_level, kawasan, desa, kecamatan, kabkota, nama_provinsi, pulau)
        SELECT hs_id, date_hotspot_ori, provinsi_id, 
                lat, long, sumber, ori_sumber, date_hotspot, desa_id, 
                counter, confidence, confidence_level, kawasan, desa, 
                kecamatan, kabkota, nama_provinsi, pulau 
        FROM temp_db_hotspot t
        EXCEPT
        SELECT hs_id, date_hotspot_ori, provinsi_id, 
                lat, long, sumber, ori_sumber, date_hotspot, desa_id, 
                counter, confidence, confidence_level, kawasan, desa, 
                kecamatan, kabkota, nama_provinsi, pulau 
        FROM hotspot_sipongi h
    `;
    console.log(">>> Berhasil Update Database Hotspot :", result);
  }
}

module.exports = DbHotspotJob;
