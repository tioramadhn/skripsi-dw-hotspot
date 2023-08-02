-- CreateTable
CREATE TABLE "dim_confidence" (
    "id_confidence" SERIAL NOT NULL,
    "confidence_level" VARCHAR(10),

    CONSTRAINT "dim_confidence_pkey" PRIMARY KEY ("id_confidence")
);

-- CreateTable
CREATE TABLE "dim_location" (
    "id_location" SERIAL NOT NULL,
    "pulau" VARCHAR(50),
    "provinsi" VARCHAR(50),
    "kab_kota" VARCHAR(50),
    "kecamatan" VARCHAR(50),
    "desa" VARCHAR(50),
    "geom_desa" geometry,

    CONSTRAINT "dim_location_pkey" PRIMARY KEY ("id_location")
);

-- CreateTable
CREATE TABLE "dim_satelite" (
    "id_satelite" SERIAL NOT NULL,
    "satelite_name" VARCHAR(20),

    CONSTRAINT "dim_satelite_pkey" PRIMARY KEY ("id_satelite")
);

-- CreateTable
CREATE TABLE "dim_time" (
    "id_time" DATE NOT NULL,
    "tahun" INTEGER,
    "semester" INTEGER,
    "kuartal" VARCHAR(5),
    "bulan" VARCHAR(25),
    "minggu" INTEGER,
    "hari" VARCHAR(25),

    CONSTRAINT "dim_time_pkey" PRIMARY KEY ("id_time")
);

-- CreateTable
CREATE TABLE "fact_hotspot" (
    "id_location" INTEGER,
    "id_time" DATE,
    "id_satelite" INTEGER,
    "id_confidence" INTEGER,
    "hotspot_count" INTEGER
);

-- CreateTable
CREATE TABLE "hotspot_sipongi" (
    "id_hs_sp" SERIAL NOT NULL,
    "hs_id" TIMESTAMPTZ(6),
    "date_hotspot_ori" TIMESTAMPTZ(6),
    "provinsi_id" INTEGER,
    "lat" DOUBLE PRECISION,
    "long" DOUBLE PRECISION,
    "sumber" VARCHAR(25),
    "ori_sumber" VARCHAR(25),
    "date_hotspot" VARCHAR(50),
    "desa_id" VARCHAR,
    "counter" INTEGER,
    "confidence" INTEGER,
    "confidence_level" VARCHAR(10),
    "kawasan" VARCHAR(255),
    "desa" VARCHAR(255),
    "kecamatan" VARCHAR(255),
    "kabkota" VARCHAR(255),
    "nama_provinsi" VARCHAR(255),
    "pulau" VARCHAR(255),

    CONSTRAINT "hotspot_sipongi_pkey" PRIMARY KEY ("id_hs_sp")
);

-- CreateTable
CREATE TABLE "temp_db_hotspot" (
    "hs_id" TIMESTAMPTZ(6),
    "date_hotspot_ori" TIMESTAMPTZ(6),
    "provinsi_id" INTEGER,
    "lat" DOUBLE PRECISION,
    "long" DOUBLE PRECISION,
    "sumber" VARCHAR(25),
    "ori_sumber" VARCHAR(25),
    "date_hotspot" VARCHAR(50),
    "desa_id" VARCHAR,
    "counter" INTEGER,
    "confidence" INTEGER,
    "confidence_level" VARCHAR(10),
    "kawasan" VARCHAR(255),
    "desa" VARCHAR(255),
    "kecamatan" VARCHAR(255),
    "kabkota" VARCHAR(255),
    "nama_provinsi" VARCHAR(255),
    "pulau" VARCHAR(255),
    "id_temp" SERIAL NOT NULL,

    CONSTRAINT "temp_db_hotspot_pkey" PRIMARY KEY ("id_temp")
);
