const { PrismaClient } = require("@prisma/client");
const cron = require("node-cron");
const {
  setAndGetURL,
  getDate,
  getHotspots,
  alertText,
} = require("./utils/helper");
const DbHotspotJob = require("./services/DbHotspotJob");
const { configTime } = require("./utils/config");
const DwHotspotJob = require("./services/DwHotspotJob");
const { configTime } = require("./utils/config");
const prisma = new PrismaClient();

const db = new DbHotspotJob(prisma);
const dw = new DwHotspotJob(prisma);

// Data hotspot init
const initDataHostpot = async (from, to) => {
  try {
    alertText("Inisialisasi data hotspot");
    const url = setAndGetURL({ from, to });
    const hotspots = await getHotspots(url);
    console.log("Total hotspot : ", hotspots?.length ?? 0);
    if (hotspots) {
      await db.updateHotspotSipongi(hotspots);
    }
  } catch (error) {
    console.log(error);
  }
};

//initDataHostpot("2023-8-8", "2023-8-9");

// Modul ETL
const dbHotspotJob = async () => {
  try {
    alertText("Memulai DB Hotspot Job");
    const date = getDate(); //Mendapatkan tanggal hari ini
    const url = setAndGetURL({ date }); //Memasang atribut tanggal pada endpoint sipongi
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
    alertText("Memulai DW Hotspot Job");
    // Modul Datawarohouse hotspot
    dw.updateDimTime();
    dw.updateDimSatelite();
    dw.updateDimConfidence();
    // dw.updateDimLocation();
    dw.updateFactHotspot();
  } catch (error) {
    console.log(error.message);
  }
};
// detik(0-59) menit(0-59) jam(0-23) tanggal(1-31) bulan(1-12 or names) dow(0-7 or names)
cron.schedule("*/30 1-23 * * *", dbHotspotJob, configTime);
cron.schedule("59 23 * * *", dwHotspotJob, configTime);
// dwHotspotJob();
dbHotspotJob();
