const dayjs = require("dayjs");
require("dayjs/locale/id"); // Impor lokal bahasa Indonesia
const utc = require("dayjs/plugin/utc"); // Impor plugin UTC
const { default: axios } = require("axios");

dayjs.extend(utc); // Menambahkan plugin UTC ke dayjs
dayjs.locale("id"); // Setel bahasa ke Indonesia

const getHotspots = async (url) => {
  const { data } = await axios.get(url);
  return data.features.map((hotspot) => {
    return hotspot.properties;
  });
};

const getDate = () => {
    const timestamp = Date.now();
//   const timestamp = new Date("2023-6-9");
  const dateObj = dayjs(timestamp).utcOffset("+07:00"); // Mengatur offset zona waktu untuk WIB
  return dateObj.format("YYYY-MM-DD");
};

const getHour = () => {
  const timestamp = Date.now();
  const dateObj = dayjs(timestamp).utcOffset("+07:00"); // Mengatur offset zona waktu untuk WIB
  return dateObj.format("hh.mm");
};

const alertText = (text) => {
  console.log(`------ ${text} ------`);
  console.log("Tanggal :", getDate());
  console.log("Jam :", getHour(), "WIB");
};

const setAndGetURL = (date, from, to) => {
  const FROM = date ?? from;
  const TO = date ?? to;
  return `https://sipongi.menlhk.go.id/api/opsroom/indoHotspot?wilayah=IN&filterperiode=true&from=${FROM}&to=${TO}&late=custom&satelit[]=LPN-MODIS&satelit[]=LPN-NPP&satelit[]=LPN-NOAA20&confidence[]=high&confidence[]=medium&confidence[]=low`;
};
module.exports = { getHotspots, alertText, getDate, setAndGetURL };
