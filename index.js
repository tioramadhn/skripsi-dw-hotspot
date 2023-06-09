const { PrismaClient } = require("@prisma/client");
const cron = require("node-cron");
const {
  setAndGetURL,
  getDate,
  getHotspots,
  alertText,
} = require("./utils/helper");
const DbHotspotJob = require("./services/DbHotspotJob");
const DwHotspotJob = require("./services/DwHotspotJob");
const prisma = new PrismaClient();

const db = new DbHotspotJob(prisma);
const dw = new DwHotspotJob(prisma);

// Modul ETL
const dbHotspotJob = async () => {
  try {
    alertText("Memulai DB Hotspot Job");
    const date = getDate(); //Mendapatkan tanggal hari ini
    const url = setAndGetURL(date); //Memasang atribut tanggal pada endpoint sipongi
    const hotspots = await getHotspots(url); //Mengambil data hotspot
    console.log("Total hotspot : ", hotspots?.length ?? 0);
    // // Modul Database Hotspot
    if (hotspots) {
      await db.updateHotspotSipongi(hotspots);
    }
  } catch (error) {
    console.error(error.message);
  }
};

const dwHotspotJob = () => {
  try {
    alertText("Memulai DB Hotspot Job");
    const date = getDate(); //Mendapatkan tanggal hari ini
    const url = setAndGetURL(date); //Memasang atribut tanggal pada endpoint sipongi
    // Modul Datawarohouse hotspot
    dw.updateDimTime(date);
    dw.updateDimSatelite();
    dw.updateDimConfidence();
    dw.updateFactHotspot();
  } catch (error) {
    console.log(error.message);
  }
};
// detik(0-59) menit(0-59) jam(0-23) tanggal(1-31) bulan(1-12 or names) dow(0-7 or names)
// cron.schedule("*/1 * * * *", dbHotspotJob, config);
// cron.schedule("59 23 * * *", dwHotspotJob, config);
// dwHotspotJob();
dbHotspotJob();
