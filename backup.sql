--
-- PostgreSQL database dump
--

\restrict aYhwUB78585NZfdIwUH73ade6zGrbA4caSf7lZro1tYomYAyDdX4v649fPa0eTn

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."_ArtistasEnObras" DROP CONSTRAINT IF EXISTS "_ArtistasEnObras_B_fkey";
ALTER TABLE IF EXISTS ONLY public."_ArtistasEnObras" DROP CONSTRAINT IF EXISTS "_ArtistasEnObras_A_fkey";
ALTER TABLE IF EXISTS ONLY public."Venta" DROP CONSTRAINT IF EXISTS "Venta_funcionId_fkey";
ALTER TABLE IF EXISTS ONLY public."Obra" DROP CONSTRAINT IF EXISTS "Obra_productorEjecutivoId_fkey";
ALTER TABLE IF EXISTS ONLY public."Mensaje" DROP CONSTRAINT IF EXISTS "Mensaje_autorId_fkey";
ALTER TABLE IF EXISTS ONLY public."LogisticaRuta" DROP CONSTRAINT IF EXISTS "LogisticaRuta_funcionId_fkey";
ALTER TABLE IF EXISTS ONLY public."Liquidacion" DROP CONSTRAINT IF EXISTS "Liquidacion_grupalId_fkey";
ALTER TABLE IF EXISTS ONLY public."Liquidacion" DROP CONSTRAINT IF EXISTS "Liquidacion_funcionId_fkey";
ALTER TABLE IF EXISTS ONLY public."LiquidacionReparto" DROP CONSTRAINT IF EXISTS "LiquidacionReparto_liquidacionId_fkey";
ALTER TABLE IF EXISTS ONLY public."LiquidacionItem" DROP CONSTRAINT IF EXISTS "LiquidacionItem_liquidacionId_fkey";
ALTER TABLE IF EXISTS ONLY public."LiquidacionGrupalItem" DROP CONSTRAINT IF EXISTS "LiquidacionGrupalItem_grupalId_fkey";
ALTER TABLE IF EXISTS ONLY public."Invitado" DROP CONSTRAINT IF EXISTS "Invitado_funcionId_fkey";
ALTER TABLE IF EXISTS ONLY public."Gasto" DROP CONSTRAINT IF EXISTS "Gasto_obraId_fkey";
ALTER TABLE IF EXISTS ONLY public."Gasto" DROP CONSTRAINT IF EXISTS "Gasto_funcionId_fkey";
ALTER TABLE IF EXISTS ONLY public."Gasto" DROP CONSTRAINT IF EXISTS "Gasto_comprobanteDocumentoId_fkey";
ALTER TABLE IF EXISTS ONLY public."Funcion" DROP CONSTRAINT IF EXISTS "Funcion_productorAsociadoId_fkey";
ALTER TABLE IF EXISTS ONLY public."Funcion" DROP CONSTRAINT IF EXISTS "Funcion_obraId_fkey";
ALTER TABLE IF EXISTS ONLY public."Documento" DROP CONSTRAINT IF EXISTS "Documento_subidoPorId_fkey";
ALTER TABLE IF EXISTS ONLY public."Documento" DROP CONSTRAINT IF EXISTS "Documento_obraId_fkey";
ALTER TABLE IF EXISTS ONLY public."Documento" DROP CONSTRAINT IF EXISTS "Documento_liquidacionId_fkey";
ALTER TABLE IF EXISTS ONLY public."Documento" DROP CONSTRAINT IF EXISTS "Documento_funcionId_fkey";
ALTER TABLE IF EXISTS ONLY public."ChecklistTarea" DROP CONSTRAINT IF EXISTS "ChecklistTarea_responsableId_fkey";
ALTER TABLE IF EXISTS ONLY public."ChecklistTarea" DROP CONSTRAINT IF EXISTS "ChecklistTarea_obraId_fkey";
ALTER TABLE IF EXISTS ONLY public."ChecklistTarea" DROP CONSTRAINT IF EXISTS "ChecklistTarea_funcionId_fkey";
ALTER TABLE IF EXISTS ONLY public."ArtistaPayout" DROP CONSTRAINT IF EXISTS "ArtistaPayout_obraId_fkey";
DROP INDEX IF EXISTS public."_ArtistasEnObras_B_index";
DROP INDEX IF EXISTS public."_ArtistasEnObras_AB_unique";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."LogisticaRuta_funcionId_key";
DROP INDEX IF EXISTS public."Liquidacion_funcionId_key";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."Venta" DROP CONSTRAINT IF EXISTS "Venta_pkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."Obra" DROP CONSTRAINT IF EXISTS "Obra_pkey";
ALTER TABLE IF EXISTS ONLY public."Mensaje" DROP CONSTRAINT IF EXISTS "Mensaje_pkey";
ALTER TABLE IF EXISTS ONLY public."LogisticaRuta" DROP CONSTRAINT IF EXISTS "LogisticaRuta_pkey";
ALTER TABLE IF EXISTS ONLY public."Liquidacion" DROP CONSTRAINT IF EXISTS "Liquidacion_pkey";
ALTER TABLE IF EXISTS ONLY public."LiquidacionReparto" DROP CONSTRAINT IF EXISTS "LiquidacionReparto_pkey";
ALTER TABLE IF EXISTS ONLY public."LiquidacionItem" DROP CONSTRAINT IF EXISTS "LiquidacionItem_pkey";
ALTER TABLE IF EXISTS ONLY public."LiquidacionGrupal" DROP CONSTRAINT IF EXISTS "LiquidacionGrupal_pkey";
ALTER TABLE IF EXISTS ONLY public."LiquidacionGrupalItem" DROP CONSTRAINT IF EXISTS "LiquidacionGrupalItem_pkey";
ALTER TABLE IF EXISTS ONLY public."Invitado" DROP CONSTRAINT IF EXISTS "Invitado_pkey";
ALTER TABLE IF EXISTS ONLY public."Gasto" DROP CONSTRAINT IF EXISTS "Gasto_pkey";
ALTER TABLE IF EXISTS ONLY public."Funcion" DROP CONSTRAINT IF EXISTS "Funcion_pkey";
ALTER TABLE IF EXISTS ONLY public."Documento" DROP CONSTRAINT IF EXISTS "Documento_pkey";
ALTER TABLE IF EXISTS ONLY public."ChecklistTarea" DROP CONSTRAINT IF EXISTS "ChecklistTarea_pkey";
ALTER TABLE IF EXISTS ONLY public."ArtistaPayout" DROP CONSTRAINT IF EXISTS "ArtistaPayout_pkey";
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."_ArtistasEnObras";
DROP TABLE IF EXISTS public."Venta";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."Obra";
DROP TABLE IF EXISTS public."Mensaje";
DROP TABLE IF EXISTS public."LogisticaRuta";
DROP TABLE IF EXISTS public."LiquidacionReparto";
DROP TABLE IF EXISTS public."LiquidacionItem";
DROP TABLE IF EXISTS public."LiquidacionGrupalItem";
DROP TABLE IF EXISTS public."LiquidacionGrupal";
DROP TABLE IF EXISTS public."Liquidacion";
DROP TABLE IF EXISTS public."Invitado";
DROP TABLE IF EXISTS public."Gasto";
DROP TABLE IF EXISTS public."Funcion";
DROP TABLE IF EXISTS public."Documento";
DROP TABLE IF EXISTS public."ChecklistTarea";
DROP TABLE IF EXISTS public."ArtistaPayout";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO "user";

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: user
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ArtistaPayout; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."ArtistaPayout" (
    id text NOT NULL,
    "obraId" text NOT NULL,
    nombre text NOT NULL,
    porcentaje numeric(5,2) NOT NULL,
    base text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ArtistaPayout" OWNER TO "user";

--
-- Name: ChecklistTarea; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."ChecklistTarea" (
    id text NOT NULL,
    "obraId" text NOT NULL,
    "funcionId" text,
    "descripcionTarea" text NOT NULL,
    "responsableId" text NOT NULL,
    "fechaLimite" timestamp(3) without time zone,
    completada boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    observaciones text
);


ALTER TABLE public."ChecklistTarea" OWNER TO "user";

--
-- Name: Documento; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Documento" (
    id text NOT NULL,
    "obraId" text,
    "funcionId" text,
    "nombreDocumento" text NOT NULL,
    "driveFileId" text NOT NULL,
    "linkDrive" text NOT NULL,
    "tipoDocumento" text NOT NULL,
    "subidoPorId" text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    "liquidacionId" text
);


ALTER TABLE public."Documento" OWNER TO "user";

--
-- Name: Funcion; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Funcion" (
    id text NOT NULL,
    "obraId" text NOT NULL,
    fecha timestamp(3) without time zone NOT NULL,
    "salaNombre" text NOT NULL,
    "salaDireccion" text,
    ciudad text NOT NULL,
    pais text DEFAULT 'Argentina'::text NOT NULL,
    "capacidadSala" integer,
    "precioEntradaBase" numeric(10,2),
    "linkVentaTicketera" text,
    "linkMonitoreoVenta" text,
    "notasProduccion" text,
    "productorAsociadoId" text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    "passVentaTicketera" text,
    "ultimaActualizacionVentas" timestamp(3) without time zone,
    "ultimaFacturacionBruta" numeric(15,2),
    "userVentaTicketera" text,
    vendidas integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Funcion" OWNER TO "user";

--
-- Name: Gasto; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Gasto" (
    id text NOT NULL,
    "obraId" text,
    "funcionId" text,
    descripcion text NOT NULL,
    monto numeric(15,2) NOT NULL,
    "tipoGasto" text NOT NULL,
    "comprobanteDocumentoId" text,
    "fechaGasto" timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Gasto" OWNER TO "user";

--
-- Name: Invitado; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Invitado" (
    id text NOT NULL,
    "funcionId" text NOT NULL,
    nombre text NOT NULL,
    cantidad integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Invitado" OWNER TO "user";

--
-- Name: Liquidacion; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Liquidacion" (
    id text NOT NULL,
    "funcionId" text NOT NULL,
    "facturacionTotal" numeric(15,2) NOT NULL,
    "costosVenta" numeric(15,2) NOT NULL,
    "recaudacionBruta" numeric(15,2) NOT NULL,
    "recaudacionNeta" numeric(15,2) NOT NULL,
    "acuerdoPorcentaje" numeric(5,2) NOT NULL,
    "acuerdoSobre" text NOT NULL,
    "resultadoCompania" numeric(15,2) NOT NULL,
    "impuestoTransferencias" numeric(15,2) NOT NULL,
    "impuestoTransferenciaPorcentaje" numeric(5,2) DEFAULT 1.2 NOT NULL,
    "resultadoFuncion" numeric(15,2) NOT NULL,
    "repartoArtistaPorcentaje" numeric(5,2),
    "repartoProduccionPorcentaje" numeric(5,2),
    "repartoArtistaMonto" numeric(15,2),
    "repartoProduccionMonto" numeric(15,2),
    moneda text DEFAULT 'ARS'::text NOT NULL,
    "tipoCambio" numeric(10,4) DEFAULT 1.0 NOT NULL,
    "bordereauxImage" text,
    confirmada boolean DEFAULT false NOT NULL,
    "fechaConfirmacion" timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    "grupalId" text
);


ALTER TABLE public."Liquidacion" OWNER TO "user";

--
-- Name: LiquidacionGrupal; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."LiquidacionGrupal" (
    id text NOT NULL,
    nombre text NOT NULL,
    "facturacionTotal" numeric(15,2) DEFAULT 0 NOT NULL,
    "costosVenta" numeric(15,2) DEFAULT 0 NOT NULL,
    "costosVentaPorcentaje" numeric(5,2),
    "recaudacionBruta" numeric(15,2) DEFAULT 0 NOT NULL,
    "recaudacionNeta" numeric(15,2) DEFAULT 0 NOT NULL,
    "acuerdoPorcentaje" numeric(5,2) DEFAULT 0 NOT NULL,
    "acuerdoSobre" text DEFAULT 'Neta'::text NOT NULL,
    "impuestoTransferenciaPorcentaje" numeric(5,2) DEFAULT 1.2 NOT NULL,
    moneda text DEFAULT 'ARS'::text NOT NULL,
    "tipoCambio" numeric(10,4) DEFAULT 1.0 NOT NULL,
    confirmada boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LiquidacionGrupal" OWNER TO "user";

--
-- Name: LiquidacionGrupalItem; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."LiquidacionGrupalItem" (
    id text NOT NULL,
    "grupalId" text NOT NULL,
    tipo text NOT NULL,
    concepto text NOT NULL,
    porcentaje numeric(5,2),
    monto numeric(15,2) NOT NULL
);


ALTER TABLE public."LiquidacionGrupalItem" OWNER TO "user";

--
-- Name: LiquidacionItem; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."LiquidacionItem" (
    id text NOT NULL,
    "liquidacionId" text NOT NULL,
    tipo text NOT NULL,
    concepto text NOT NULL,
    porcentaje numeric(5,2),
    monto numeric(15,2) NOT NULL
);


ALTER TABLE public."LiquidacionItem" OWNER TO "user";

--
-- Name: LiquidacionReparto; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."LiquidacionReparto" (
    id text NOT NULL,
    "liquidacionId" text NOT NULL,
    "nombreArtista" text NOT NULL,
    porcentaje numeric(5,2) NOT NULL,
    base text NOT NULL,
    monto numeric(15,2) NOT NULL,
    "retencionAAA" numeric(15,2),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "aplicaAAA" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."LiquidacionReparto" OWNER TO "user";

--
-- Name: LogisticaRuta; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."LogisticaRuta" (
    id text NOT NULL,
    "funcionId" text NOT NULL,
    "comidasDetalle" text,
    "contactosLocales" text,
    "telProductorEjecutivo" text,
    "telProductorAsociado" text,
    "telTraslados" text,
    "telHoteles" text,
    "fechaEnvioRuta" timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    "alojamientoNoAplicaArtista" boolean DEFAULT false NOT NULL,
    "alojamientoNoAplicaProduccion" boolean DEFAULT false NOT NULL,
    "detalleTrasladoIdaArtista" text,
    "detalleTrasladoIdaProduccion" text,
    "detalleTrasladoVueltaArtista" text,
    "detalleTrasladoVueltaProduccion" text,
    "horarioCitacionArtista" text,
    "horarioEntradaSala" text,
    "hotelDireccionArtista" text,
    "hotelDireccionProduccion" text,
    "hotelNombreArtista" text,
    "hotelNombreProduccion" text,
    "linkFlyersRedes" text,
    "linkGraficaTicketera" text,
    "tipoTrasladoIdaArtista" text,
    "tipoTrasladoIdaProduccion" text,
    "tipoTrasladoVueltaArtista" text,
    "tipoTrasladoVueltaProduccion" text
);


ALTER TABLE public."LogisticaRuta" OWNER TO "user";

--
-- Name: Mensaje; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Mensaje" (
    id text NOT NULL,
    contenido text NOT NULL,
    "autorId" text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Mensaje" OWNER TO "user";

--
-- Name: Obra; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Obra" (
    id text NOT NULL,
    nombre text NOT NULL,
    "artistaPrincipal" text NOT NULL,
    descripcion text,
    estado text NOT NULL,
    "fechaEstreno" timestamp(3) without time zone,
    "productorEjecutivoId" text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    "driveFolderId" text
);


ALTER TABLE public."Obra" OWNER TO "user";

--
-- Name: User; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text,
    rol text NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    telefono text,
    "googleAccessToken" text,
    "googleRefreshToken" text,
    "googleTokenExpiry" timestamp(3) without time zone,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    "resetPasswordExpires" timestamp(3) without time zone,
    "resetPasswordToken" text
);


ALTER TABLE public."User" OWNER TO "user";

--
-- Name: Venta; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Venta" (
    id text NOT NULL,
    "funcionId" text NOT NULL,
    "fechaRegistro" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tipoVenta" text NOT NULL,
    "entradasVendidas" integer NOT NULL,
    "facturacionBruta" numeric(15,2),
    "canalVenta" text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Venta" OWNER TO "user";

--
-- Name: _ArtistasEnObras; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."_ArtistasEnObras" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_ArtistasEnObras" OWNER TO "user";

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO "user";

--
-- Data for Name: ArtistaPayout; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."ArtistaPayout" (id, "obraId", nombre, porcentaje, base, created_at, updated_at) FROM stdin;
2f768f96-4f87-4e45-b8df-a8ee013428d4	536dc9b9-1b71-4cf4-8dc1-d6710ba80eb4	Boy Olmi	70.00	Utilidad	2026-02-17 16:02:42.487	2026-02-17 16:02:42.487
a0112ba4-f03d-4cc8-8cbe-8e20b4733904	27e43cc5-63ae-4c72-b239-616b236cc462	pepe	6.00	Neta	2026-02-17 22:55:39.512	2026-02-17 22:55:39.512
caa49b0c-e4a2-491b-bfe0-647e016b2216	27e43cc5-63ae-4c72-b239-616b236cc462	pocho	8.00	Neta	2026-02-17 22:55:39.512	2026-02-17 22:55:39.512
\.


--
-- Data for Name: ChecklistTarea; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."ChecklistTarea" (id, "obraId", "funcionId", "descripcionTarea", "responsableId", "fechaLimite", completada, created_at, updated_at, observaciones) FROM stdin;
\.


--
-- Data for Name: Documento; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Documento" (id, "obraId", "funcionId", "nombreDocumento", "driveFileId", "linkDrive", "tipoDocumento", "subidoPorId", created_at, updated_at, "liquidacionId") FROM stdin;
b162ad93-a082-4ede-82ea-3db6a5a9890d	\N	ba492816-ab96-4fc8-a8ee-bb7bd310ebe3	Viernes CABA - Feed.png	local	/uploads/comprobantes/comprobante-1770663124111-921674553.png	Comprobante	b154600a-7efb-40a2-8eb4-2e41790647f9	2026-02-09 18:52:04.215	2026-02-09 18:52:04.215	\N
b7111a03-c24d-4388-9ef7-5aabed17f44d	\N	ba492816-ab96-4fc8-a8ee-bb7bd310ebe3	25 DE MAYO.jpg	local	/uploads/comprobantes/comprobante-1770663135619-758461650.jpg	Comprobante	b154600a-7efb-40a2-8eb4-2e41790647f9	2026-02-09 18:52:15.655	2026-02-09 18:52:15.655	\N
280555b5-72cd-489b-9f18-3b7eb55f6d1b	\N	\N	WhatsApp Image 2026-02-09 at 16.18.41.jpeg	local	/uploads/comprobantes/comprobante-1770664761524-787408276.jpeg	Comprobante	b154600a-7efb-40a2-8eb4-2e41790647f9	2026-02-09 19:19:21.551	2026-02-09 19:19:21.551	8b9337bc-63dd-44ab-a2d3-f7f5eb11a374
d10ac625-45c9-48a3-b484-50e164eb90ea	\N	\N	WhatsApp Image 2026-02-09 at 16.16.40.jpeg	local	/uploads/comprobantes/comprobante-1770678732923-729152891.jpeg	Comprobante	b154600a-7efb-40a2-8eb4-2e41790647f9	2026-02-09 23:12:13.048	2026-02-09 23:12:13.048	d274bab3-9668-4bcb-8f43-dce685dbd370
5ea4a0af-3b33-4110-b794-a0ae10501afd	\N	\N	WhatsApp Image 2026-02-09 at 16.18.41.jpeg	local	/uploads/comprobantes/comprobante-1770679898661-863945603.jpeg	Comprobante	b154600a-7efb-40a2-8eb4-2e41790647f9	2026-02-09 23:31:38.691	2026-02-09 23:31:38.691	8b9337bc-63dd-44ab-a2d3-f7f5eb11a374
074b28b8-0067-4b88-933c-ef2191705661	536dc9b9-1b71-4cf4-8dc1-d6710ba80eb4	\N	gacetilla boy	12F36-_lHFwKcxP8RUaCRxxKdzt_oze64	https://docs.google.com/document/d/12F36-_lHFwKcxP8RUaCRxxKdzt_oze64/edit?usp=drivesdk&ouid=105676038775730720826&rtpof=true&sd=true	Material de Prensa	b154600a-7efb-40a2-8eb4-2e41790647f9	2026-02-12 16:51:46.839	2026-02-12 16:51:46.839	\N
0c86a3d3-6562-4f02-ac41-e0cdb1d4fa34	b8da45d0-7434-4833-93a4-ce890e37d931	\N	LIMBICO RIDER COMPLETO	1Kz9cwO0frv9j3TquZTIUJoq_R8hxsekJ	https://drive.google.com/file/d/1Kz9cwO0frv9j3TquZTIUJoq_R8hxsekJ/view?usp=drivesdk	Rider	b154600a-7efb-40a2-8eb4-2e41790647f9	2026-02-12 17:08:07.39	2026-02-12 17:08:07.39	\N
cafe5cbc-475d-4817-a066-19d385236a45	b8da45d0-7434-4833-93a4-ce890e37d931	\N	LIMBICO GUIA DE LUCES	1H-yRA9o2YTFHt4tOomBp6OeTYQA0vDNS	https://drive.google.com/file/d/1H-yRA9o2YTFHt4tOomBp6OeTYQA0vDNS/view?usp=drivesdk	Rider	b154600a-7efb-40a2-8eb4-2e41790647f9	2026-02-12 17:08:36.289	2026-02-12 17:08:36.289	\N
\.


--
-- Data for Name: Funcion; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Funcion" (id, "obraId", fecha, "salaNombre", "salaDireccion", ciudad, pais, "capacidadSala", "precioEntradaBase", "linkVentaTicketera", "linkMonitoreoVenta", "notasProduccion", "productorAsociadoId", created_at, updated_at, "passVentaTicketera", "ultimaActualizacionVentas", "ultimaFacturacionBruta", "userVentaTicketera", vendidas) FROM stdin;
ba492816-ab96-4fc8-a8ee-bb7bd310ebe3	b4e09add-8efe-4145-8142-e40771e8e932	2026-01-24 00:00:00	LA TANGENTE		CABA	Argentina	130	\N				\N	2026-02-09 17:01:26.237	2026-02-09 18:22:27.317		2026-02-09 18:22:27.309	2525000.00		101
ecc10f7f-0e27-4405-904d-f3d297e7aeaf	b4e09add-8efe-4145-8142-e40771e8e932	2026-02-21 23:45:00	CAFÉ BERLIN, CABA	\N	CAFÉ BERLIN	Argentina	\N	\N	\N	\N		\N	2026-02-09 19:27:05.526	2026-02-09 19:27:05.526	\N	\N	\N	\N	0
af58c906-c050-4cf3-a0ed-5e990d272cb8	b4e09add-8efe-4145-8142-e40771e8e932	2026-01-31 00:00:00	LA TANGENTE		CABA	Argentina	130	\N				\N	2026-02-09 19:22:30.242	2026-02-09 19:28:16.777		2026-02-09 19:28:16.775	1925000.00		77
6f73338f-e6de-491f-9ce6-44882bd9e421	b4e09add-8efe-4145-8142-e40771e8e932	2026-02-07 00:00:00	CAFE BERLIN		CABA	Argentina	150	\N				\N	2026-02-09 20:00:17.196	2026-02-09 20:05:08.015		2026-02-09 20:05:08.013	3940000.00		138
512e38f9-21be-47ec-95e2-00b531073b72	b8da45d0-7434-4833-93a4-ce890e37d931	2026-04-17 00:00:00	NINI MARSHALL	\N	TIGRE	Argentina	\N	\N	\N	\N		\N	2026-02-09 22:25:06.772	2026-02-09 22:25:06.772	\N	\N	\N	\N	0
5f83cc80-ed86-49c0-8878-dddc894bcb4b	b8da45d0-7434-4833-93a4-ce890e37d931	2026-04-23 23:20:00	AUDITORIO BELGRANO	\N	CABA	Argentina	\N	\N	\N	\N		\N	2026-02-09 22:25:06.781	2026-02-09 22:25:06.781	\N	\N	\N	\N	0
27e83d40-65b3-461c-a5f5-b3bccce9bda6	35dd8560-935f-41a3-87ac-d6d8580905ec	2026-01-25 01:00:00	RADIO CITY		MAR DEL PLATA	Argentina	1398	\N				\N	2026-02-09 22:48:38.509	2026-02-09 22:52:13.715		2026-02-09 22:52:13.707	32550000.00		1002
e4dd23b7-50f0-4054-940b-1bea6dbf4751	35dd8560-935f-41a3-87ac-d6d8580905ec	2026-02-15 00:30:00	ENJOY SALA RIO DE JANEIRO	\N	PUNTA DEL ESTE	Argentina	\N	\N	\N	\N		\N	2026-02-10 13:11:15.894	2026-02-10 13:11:15.894	\N	\N	\N	\N	0
5bfb9e51-8942-422f-a484-f13f575f0b4e	b8da45d0-7434-4833-93a4-ce890e37d931	2026-02-07 00:00:00	GRAN PILAR		PILAR	Argentina	784	\N				\N	2026-02-09 22:16:02.833	2026-02-11 14:29:59.648		2026-02-09 22:20:51.111	35730000.00		762
25ad1da4-7a0f-4f52-9ef4-7bb64fc32c5d	b8da45d0-7434-4833-93a4-ce890e37d931	2026-05-01 00:00:00	TEATRO MARIN		SAN ISIDRO	Argentina	800	\N				\N	2026-02-12 14:19:17.792	2026-02-12 14:19:17.792		\N	\N		0
8e09240b-86ca-4eb1-a29c-08278de388e4	536dc9b9-1b71-4cf4-8dc1-d6710ba80eb4	2026-02-19 23:00:00	PICADERO		CABA	Argentina	270	\N				\N	2026-02-12 16:00:30.989	2026-02-12 16:00:30.989		\N	\N		0
4abe443e-0072-4de9-b53a-a710d83e1f39	536dc9b9-1b71-4cf4-8dc1-d6710ba80eb4	2026-02-26 23:00:00	PICADERO		CABA	Argentina	270	\N				\N	2026-02-12 16:00:31.066	2026-02-12 16:00:31.066		\N	\N		0
13702258-1755-4f45-847b-d29fe550a829	536dc9b9-1b71-4cf4-8dc1-d6710ba80eb4	2026-03-05 23:00:00	PICADERO		CABA	Argentina	270	\N				\N	2026-02-12 16:00:31.077	2026-02-12 16:00:31.077		\N	\N		0
84fbc777-7c37-4435-a392-f8e55979c68e	536dc9b9-1b71-4cf4-8dc1-d6710ba80eb4	2026-03-12 23:00:00	PICADERO		CABA	Argentina	270	\N				\N	2026-02-12 16:00:31.094	2026-02-12 16:00:31.094		\N	\N		0
83038226-3741-41bf-b83a-9057471dd953	536dc9b9-1b71-4cf4-8dc1-d6710ba80eb4	2026-03-19 23:00:00	PICADERO		CABA	Argentina	270	\N				\N	2026-02-12 16:00:31.107	2026-02-12 16:00:31.107		\N	\N		0
2b39d64e-431e-4c33-a401-1263336d4b43	536dc9b9-1b71-4cf4-8dc1-d6710ba80eb4	2026-03-26 23:00:00	PICADERO		CABA	Argentina	270	\N				\N	2026-02-12 16:00:31.125	2026-02-12 16:00:31.125		\N	\N		0
b815b8a9-c0a7-4f33-af0e-46ae1c7d4fc6	b8da45d0-7434-4833-93a4-ce890e37d931	2026-04-02 00:00:00	GRAN ITUZAINGO		ITUZAINGO	Argentina	\N	\N				\N	2026-02-09 22:25:06.727	2026-02-12 16:08:48.907		\N	\N		0
00fa5919-47fb-4418-9562-3fff380cdf3e	b8da45d0-7434-4833-93a4-ce890e37d931	2026-04-23 00:00:00	Teatro Coliseo		Lomas de Zamora	Argentina	\N	\N				\N	2026-02-13 10:17:20.439	2026-02-13 10:17:20.439		\N	\N		0
bdeeb35e-f4e8-4bdd-b023-516f776c9c2b	b4e09add-8efe-4145-8142-e40771e8e932	2026-03-10 00:00:00	MELANY		MAR DEL PLATA	Argentina	\N	\N				\N	2026-02-09 19:27:05.547	2026-02-13 12:50:32.362		\N	\N		0
1b17da64-4a51-4211-8184-1bf64e2e5681	27e43cc5-63ae-4c72-b239-616b236cc462	2026-02-13 10:25:00	Sala Test		Ciudad Test	Argentina	600	\N				\N	2026-02-13 10:25:23.035	2026-02-18 00:13:38.835		2026-02-18 00:13:38.834	35000000.00		500
8e59c7a9-62ef-4c36-bdc3-ec643233eea1	536dc9b9-1b71-4cf4-8dc1-d6710ba80eb4	2026-02-12 23:00:00	PICADERO		CABA	Argentina	270	\N				\N	2026-02-12 15:52:28.198	2026-02-17 19:19:39.615		2026-02-17 19:19:39.613	5517250.00		180
905477d4-42b2-49e0-8997-04268c9989a0	27e43cc5-63ae-4c72-b239-616b236cc462	2026-02-17 00:00:00	NINI MARSHALL		TIGRE	Argentina	\N	\N				\N	2026-02-17 22:41:07.3	2026-02-17 23:10:56.118		2026-02-17 23:10:56.117	35000000.00		500
f323a88f-71c3-48ed-b488-95fe5aee9c0f	536dc9b9-1b71-4cf4-8dc1-d6710ba80eb4	2026-02-05 23:00:00	PICADERO		CABA	Argentina	270	\N				\N	2026-02-17 17:11:09.353	2026-02-17 23:29:07.697		2026-02-17 23:29:07.696	3914750.00		126
d5121348-3b1f-49cd-94b0-4dc8b3319d45	27e43cc5-63ae-4c72-b239-616b236cc462	2026-02-16 00:00:00	TEATRO MARIN		SAN ISIDRO	Argentina	800	\N				\N	2026-02-17 23:03:34.02	2026-02-17 23:47:55.507		2026-02-17 23:47:55.504	70000000.00		700
\.


--
-- Data for Name: Gasto; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Gasto" (id, "obraId", "funcionId", descripcion, monto, "tipoGasto", "comprobanteDocumentoId", "fechaGasto", created_at, updated_at) FROM stdin;
3e29aec5-d190-414c-ad42-f5849ca03be2	\N	ba492816-ab96-4fc8-a8ee-bb7bd310ebe3	TRASLADO DAY Y LUCES	43875.00	Publicidad	\N	2026-02-09 00:00:00	2026-02-09 19:05:38.838	2026-02-09 19:05:38.838
2e503c8a-c531-4af2-8aa8-3bc0ed68ce1e	\N	ba492816-ab96-4fc8-a8ee-bb7bd310ebe3	MATERIALES LUCES	64969.00	Publicidad	\N	2026-02-09 00:00:00	2026-02-09 19:06:05.813	2026-02-09 19:06:05.813
b34c2cad-668b-4a72-8e7a-c46079d61168	\N	f323a88f-71c3-48ed-b488-95fe5aee9c0f	catering	2000.00	Otros	\N	2026-02-05 00:00:00	2026-02-17 18:02:23.151	2026-02-17 18:02:23.151
31feec45-e92e-468b-92dd-49c93b7c99f3	\N	8e59c7a9-62ef-4c36-bdc3-ec643233eea1	agua	1215.00	Publicidad	\N	2026-02-17 00:00:00	2026-02-17 20:51:06.706	2026-02-17 20:51:06.706
04738436-0bda-4a09-979f-625300a031c7	\N	f323a88f-71c3-48ed-b488-95fe5aee9c0f	cables	6500.00	Publicidad	\N	2026-02-07 00:00:00	2026-02-17 21:43:45.353	2026-02-17 21:43:45.353
9f7a4f45-c31c-47df-b7fc-0612df23e53b	\N	f323a88f-71c3-48ed-b488-95fe5aee9c0f	banner	5000.00	Aéreo	\N	2026-02-07 00:00:00	2026-02-17 22:08:58.817	2026-02-17 22:08:58.817
\.


--
-- Data for Name: Invitado; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Invitado" (id, "funcionId", nombre, cantidad, created_at, updated_at) FROM stdin;
99ff46d5-2301-4f96-a169-2d39bf9a5ac1	1b17da64-4a51-4211-8184-1bf64e2e5681	Invitado de Prueba	5	2026-02-13 10:25:23.47	2026-02-13 10:25:23.47
1385392a-4a98-4120-aaeb-0a92c7fc0f0f	e4dd23b7-50f0-4054-940b-1bea6dbf4751	pipe stein	2	2026-02-13 10:28:38.394	2026-02-13 10:28:38.394
7aec1441-2586-4c9b-94c3-3ee9d3ba4ac8	e4dd23b7-50f0-4054-940b-1bea6dbf4751	daniel zulamian	2	2026-02-13 10:28:50.393	2026-02-13 10:28:50.393
11610cb9-9afb-4f46-b50b-6b549d97e62f	e4dd23b7-50f0-4054-940b-1bea6dbf4751	pablo marques	4	2026-02-13 10:31:03.018	2026-02-13 10:31:03.018
\.


--
-- Data for Name: Liquidacion; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Liquidacion" (id, "funcionId", "facturacionTotal", "costosVenta", "recaudacionBruta", "recaudacionNeta", "acuerdoPorcentaje", "acuerdoSobre", "resultadoCompania", "impuestoTransferencias", "impuestoTransferenciaPorcentaje", "resultadoFuncion", "repartoArtistaPorcentaje", "repartoProduccionPorcentaje", "repartoArtistaMonto", "repartoProduccionMonto", moneda, "tipoCambio", "bordereauxImage", confirmada, "fechaConfirmacion", created_at, updated_at, "grupalId") FROM stdin;
90d565aa-2ed5-4b83-93bc-4a514805cc49	af58c906-c050-4cf3-a0ed-5e990d272cb8	1925000.00	0.00	1925000.00	1732500.00	20.00	Bruta	1347500.00	16170.00	1.20	980438.90	70.00	30.00	686307.23	294131.67	ARS	1.0000	/uploads/bordereaux/bordereaux-1770665494834-493459824.jpeg	t	2026-02-09 19:31:41.818	2026-02-09 19:30:49.598	2026-02-09 19:31:41.82	\N
8b9337bc-63dd-44ab-a2d3-f7f5eb11a374	ba492816-ab96-4fc8-a8ee-bb7bd310ebe3	2525000.00	0.00	2525000.00	2272500.00	20.00	Neta	1818000.00	21816.00	1.20	1687340.00	70.00	30.00	1181138.00	506202.00	ARS	1.0000	/uploads/bordereaux/bordereaux-1770664126002-139164850.jpeg	t	2026-02-09 23:31:49.552	2026-02-09 18:29:10.54	2026-02-09 23:31:49.553	\N
d274bab3-9668-4bcb-8f43-dce685dbd370	27e83d40-65b3-461c-a5f5-b3bccce9bda6	32550000.00	0.00	32550000.00	29207940.00	25.00	Neta	21905955.00	262871.46	1.20	18521825.52	\N	30.00	\N	5556547.66	ARS	1.0000	/uploads/bordereaux/bordereaux-1770678449781-599528075.jpeg	t	2026-02-11 22:42:52.849	2026-02-09 23:06:52.661	2026-02-11 22:42:52.855	\N
4626fbd7-2d07-450c-a9f7-71f782f19d6b	5bfb9e51-8942-422f-a484-f13f575f0b4e	35730000.00	1764500.00	33965500.00	30488899.00	30.00	Neta	21342229.30	256106.75	1.20	19596175.55	\N	30.00	\N	3919235.11	ARS	1.0000	\N	t	2026-02-11 22:46:50.068	2026-02-09 22:24:59.157	2026-02-11 22:46:50.07	\N
c7c87b4c-79e6-445e-9a3a-af4ab55b9cc9	6f73338f-e6de-491f-9ce6-44882bd9e421	3940000.00	0.00	3940000.00	3496000.00	25.00	Neta	2622000.00	31464.00	1.20	2014223.85	\N	30.00	\N	604267.15	ARS	1.0000	/uploads/bordereaux/bordereaux-1770668032865-473096467.jpeg	f	\N	2026-02-09 20:13:41.067	2026-02-12 14:10:00.522	\N
774ccf04-011e-4569-8b4b-2a1f497fd6f6	f323a88f-71c3-48ed-b488-95fe5aee9c0f	3914750.00	181650.00	3733100.00	3345723.80	30.00	Bruta	2225793.80	26709.53	1.20	2085212.58	\N	30.00	\N	625563.77	ARS	1.0000	\N	f	\N	2026-02-17 17:15:30.206	2026-02-17 23:29:07.579	\N
fb215947-6393-428e-926a-ed7d0261ce52	d5121348-3b1f-49cd-94b0-4dc8b3319d45	70000000.00	60000.00	69940000.00	62806120.00	30.00	Bruta	41824120.00	501889.44	1.20	32529373.76	\N	30.00	\N	32529373.76	ARS	1.0000	\N	f	\N	2026-02-17 23:07:44.404	2026-02-17 23:47:55.426	30dd0729-074c-4478-89b5-b2986ea8f925
8efa3aea-6271-40b6-ba33-ae3ef8ea6bb9	1b17da64-4a51-4211-8184-1bf64e2e5681	35000000.00	500000.00	34500000.00	30975000.00	30.00	Bruta	20625000.00	247500.00	1.20	16041000.00	\N	30.00	\N	16041000.00	ARS	1.0000	\N	f	\N	2026-02-17 22:55:27.276	2026-02-18 00:13:38.755	30dd0729-074c-4478-89b5-b2986ea8f925
710636ae-4c2c-49a2-bf96-03079291da6f	905477d4-42b2-49e0-8997-04268c9989a0	35000000.00	50000.00	34950000.00	31385100.00	30.00	Bruta	20900100.00	250801.20	1.20	16255384.80	\N	30.00	\N	16255384.80	ARS	1.0000	\N	f	\N	2026-02-17 23:07:44.428	2026-02-17 23:10:56.081	30dd0729-074c-4478-89b5-b2986ea8f925
3d7b1dfb-0c4f-4e88-a500-49fe8733a6a3	8e59c7a9-62ef-4c36-bdc3-ec643233eea1	5517250.00	246225.00	5517250.00	4724140.45	30.00	Bruta	3142832.95	37714.00	1.20	2946988.95	\N	0.00	\N	884096.68	ARS	1.0000	\N	f	\N	2026-02-17 17:16:05.497	2026-02-17 23:26:23.552	\N
\.


--
-- Data for Name: LiquidacionGrupal; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."LiquidacionGrupal" (id, nombre, "facturacionTotal", "costosVenta", "costosVentaPorcentaje", "recaudacionBruta", "recaudacionNeta", "acuerdoPorcentaje", "acuerdoSobre", "impuestoTransferenciaPorcentaje", moneda, "tipoCambio", confirmada, created_at, updated_at) FROM stdin;
30dd0729-074c-4478-89b5-b2986ea8f925	PRUEBA2	140000000.00	610000.00	0.00	139390000.00	125166220.00	0.00	Neta	0.00	ARS	0.0000	f	2026-02-17 23:09:16.805	2026-02-18 00:14:18.369
\.


--
-- Data for Name: LiquidacionGrupalItem; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."LiquidacionGrupalItem" (id, "grupalId", tipo, concepto, porcentaje, monto) FROM stdin;
556252cf-4f5e-47e0-a53c-9b7690f44ad5	30dd0729-074c-4478-89b5-b2986ea8f925	Deduccion	Argentores	\N	0.00
b6b0977d-3d2f-4ee9-a816-43b905b151f0	30dd0729-074c-4478-89b5-b2986ea8f925	Deduccion	Sadaic	\N	0.00
9f373bcc-5c99-4160-a5b4-68402f46cc7d	30dd0729-074c-4478-89b5-b2986ea8f925	Deduccion	AADET	0.20	0.00
\.


--
-- Data for Name: LiquidacionItem; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."LiquidacionItem" (id, "liquidacionId", tipo, concepto, porcentaje, monto) FROM stdin;
023eb63c-91bb-4fbb-8660-4854097ea0a9	710636ae-4c2c-49a2-bf96-03079291da6f	Deduccion	argentores	10.00	3495000.00
d88ed4e1-1e27-4d1d-b9bc-7e5ef63e95a9	710636ae-4c2c-49a2-bf96-03079291da6f	Deduccion	AADET 	0.20	69900.00
bd5bb461-fb3c-4750-b65c-a0bc2f31b3fe	774ccf04-011e-4569-8b4b-2a1f497fd6f6	Deduccion	Argentores	10.00	373310.00
e066a22a-c17f-4b07-bf7e-1c8420337e72	774ccf04-011e-4569-8b4b-2a1f497fd6f6	Deduccion	Sadaic	\N	0.00
05e00a16-184a-48db-bfde-2b0586a7a654	774ccf04-011e-4569-8b4b-2a1f497fd6f6	Deduccion	AADET	0.20	7466.20
7ac833c6-ba38-4fd9-81c8-0d61f22b9206	774ccf04-011e-4569-8b4b-2a1f497fd6f6	Deduccion	Ticketing	\N	6600.00
10757163-8f68-4f7e-b8d7-3ff316f58f5d	774ccf04-011e-4569-8b4b-2a1f497fd6f6	Gasto	Direccion	\N	100371.69
51348676-f9b6-4c4b-8262-15f1e688e1e3	774ccf04-011e-4569-8b4b-2a1f497fd6f6	Gasto	Gastos de Caja (Registro)	\N	13500.00
aac8dacd-1af8-4d1a-b614-8946b3b89855	90d565aa-2ed5-4b83-93bc-4a514805cc49	Deduccion	Argentores	10.00	192500.00
01c1c4a7-3d82-491d-85a2-ee83b72898ba	90d565aa-2ed5-4b83-93bc-4a514805cc49	Gasto	Gastos de Caja (Registro)	\N	0.00
5426fb47-cf45-43da-bd59-c2da3a61d673	90d565aa-2ed5-4b83-93bc-4a514805cc49	Gasto	TRASLADO DAY	\N	15000.00
33a2c6ac-d423-4ec7-a818-7071fd4fd079	90d565aa-2ed5-4b83-93bc-4a514805cc49	Gasto	PRODUCTORA EJECUTIVA	\N	130000.00
fb015bb4-a4f1-4577-a6ee-bdd4bb6ab445	90d565aa-2ed5-4b83-93bc-4a514805cc49	Gasto	MICROFONOS	\N	60000.00
81dcfd66-6ce3-458e-8caa-b4220887be12	90d565aa-2ed5-4b83-93bc-4a514805cc49	Gasto	DISEÑO GRAFICO	\N	20000.00
529f47a6-3966-42e7-909d-44ef48a711cf	90d565aa-2ed5-4b83-93bc-4a514805cc49	Gasto	PAUTA DIGITAL	\N	115891.10
80a6f2da-41a7-438b-b985-5bfbe8f25585	90d565aa-2ed5-4b83-93bc-4a514805cc49	Gasto	PANTALLA	\N	10000.00
bd13b20a-9b88-46e4-b214-ac44648fcfb9	8b9337bc-63dd-44ab-a2d3-f7f5eb11a374	Deduccion	Argentores	10.00	252500.00
bb87b1b2-b9f5-4cf2-913c-690d23cfdd03	8b9337bc-63dd-44ab-a2d3-f7f5eb11a374	Gasto	Gastos de Caja (Registro)	\N	108844.00
022dafe3-dd59-40c6-82f7-ea4d815aaaeb	d274bab3-9668-4bcb-8f43-dce685dbd370	Deduccion	Argentores	10.00	3255000.00
bbdfca8b-8cd8-4235-a7f9-a9ae28a98f16	d274bab3-9668-4bcb-8f43-dce685dbd370	Deduccion	Ticketing	\N	21960.00
36d21cbb-7d9e-47be-8cd6-25b446688caf	d274bab3-9668-4bcb-8f43-dce685dbd370	Deduccion	AADET	0.20	65100.00
bc7c2656-f7fe-48da-bc49-2882b097d82b	d274bab3-9668-4bcb-8f43-dce685dbd370	Gasto	CAJA CHICA	\N	51500.00
492b28b9-b5a9-440c-87cb-804d53d66381	d274bab3-9668-4bcb-8f43-dce685dbd370	Gasto	TRASLADO RETIRO	\N	18000.00
1b6ce630-05b1-415a-8135-ac4e87180c55	d274bab3-9668-4bcb-8f43-dce685dbd370	Gasto	PASAJE VANI	\N	62700.00
e1f07bfe-8f3e-49ff-968b-5aa485d87f1d	d274bab3-9668-4bcb-8f43-dce685dbd370	Gasto	FOTOS	\N	250000.00
58a56a71-a838-49c8-9e3d-da9f0d851943	d274bab3-9668-4bcb-8f43-dce685dbd370	Gasto	MICROFONOS	\N	60000.00
bbe7378c-2f04-4e2b-9134-0014696b490e	d274bab3-9668-4bcb-8f43-dce685dbd370	Gasto	DISEÑO GRAFICO	\N	85000.00
95c9f212-9c91-43b2-ac6b-8e6bbf773291	d274bab3-9668-4bcb-8f43-dce685dbd370	Gasto	OPERADOR SONIDO	\N	200000.00
38506a90-ce06-4f42-a23b-245763f6b3a9	d274bab3-9668-4bcb-8f43-dce685dbd370	Gasto	TECNICA TEATRO	\N	800000.00
43eb1109-1be0-4182-8e63-3913b70c12c0	d274bab3-9668-4bcb-8f43-dce685dbd370	Gasto	PLOTTER PUERTA	\N	23500.00
98dc41eb-0465-4503-b962-47c0a3951bbe	d274bab3-9668-4bcb-8f43-dce685dbd370	Gasto	PRENSA	\N	230000.00
f9581a87-2f36-41b0-b0cc-f1912f47c19b	d274bab3-9668-4bcb-8f43-dce685dbd370	Gasto	NAFTA	\N	74000.00
fc59c167-86d3-4c1e-b478-e71e39e7aab9	d274bab3-9668-4bcb-8f43-dce685dbd370	Gasto	CENA Y ALMIERZO	\N	310000.00
e7947f3a-15a2-4f67-89bd-575a8ddec374	d274bab3-9668-4bcb-8f43-dce685dbd370	Gasto	PAUTA DIGITAL	\N	631058.02
d208f64c-807a-4cc4-82e9-4074b4b40848	d274bab3-9668-4bcb-8f43-dce685dbd370	Gasto	VANI PROD EJEC	\N	325500.00
6d9bce34-46c9-491a-add5-b3de801b8fb7	4626fbd7-2d07-450c-a9f7-71f782f19d6b	Deduccion	Argentores	10.00	3396550.00
a153cdd3-3c90-43ce-b3ca-edcdb988f7cc	4626fbd7-2d07-450c-a9f7-71f782f19d6b	Deduccion	AADET	0.20	67931.00
bad438cf-9b27-4133-a2ef-31d7489a7ab1	4626fbd7-2d07-450c-a9f7-71f782f19d6b	Deduccion	TICKETING	\N	12120.00
066784d6-07b9-4e5a-bd2c-250f6d91b856	4626fbd7-2d07-450c-a9f7-71f782f19d6b	Gasto	PROYECTOR	\N	250000.00
df9ba907-b4ca-4dd6-9bfd-7e958eb284ae	4626fbd7-2d07-450c-a9f7-71f782f19d6b	Gasto	PERCUSIONISTA	\N	225000.00
6f4c2eaf-4463-4a22-8f5c-707e2b68e308	4626fbd7-2d07-450c-a9f7-71f782f19d6b	Gasto	MICROFONOS	\N	60000.00
e5753c6a-e488-48b4-8a37-c248c0a0be8a	4626fbd7-2d07-450c-a9f7-71f782f19d6b	Gasto	PAUTA DIGITAL	\N	954947.00
34ad9dcf-17d0-41a3-86d2-9d491843b2af	4626fbd7-2d07-450c-a9f7-71f782f19d6b	Gasto	+	\N	0.00
71a6113c-e4d3-4ef0-b99b-1affe997acda	c7c87b4c-79e6-445e-9a3a-af4ab55b9cc9	Deduccion	Argentores	10.00	394000.00
8993df98-d4c7-4a7b-9922-231a3b1b5688	c7c87b4c-79e6-445e-9a3a-af4ab55b9cc9	Deduccion	Operador	\N	50000.00
526a5be5-5512-4271-9083-9359b5e6fb02	c7c87b4c-79e6-445e-9a3a-af4ab55b9cc9	Gasto	TRASLADO DAY	\N	23525.00
eb3d1696-52d4-4aa4-ad97-9eaa18b4a061	c7c87b4c-79e6-445e-9a3a-af4ab55b9cc9	Gasto	PRODUCCION EJECUTIVA	\N	130000.00
7269a5fe-0ff3-4fe0-a886-97e77ba2e6ce	c7c87b4c-79e6-445e-9a3a-af4ab55b9cc9	Gasto	DISEÑO GRAFICO	\N	20000.00
0049c6ab-0b18-420c-8111-9d8afe2d33be	c7c87b4c-79e6-445e-9a3a-af4ab55b9cc9	Gasto	MICROFONOS 	\N	60000.00
94d8dd06-5a85-4bd9-a686-b3e6e9e8ec02	c7c87b4c-79e6-445e-9a3a-af4ab55b9cc9	Gasto	PAUTA DIGITAL	\N	332787.15
6d85129a-a632-405e-b230-b0afb76011b9	c7c87b4c-79e6-445e-9a3a-af4ab55b9cc9	Gasto	Gastos de Caja (Registro)	\N	10000.00
1cca1a42-b57e-4865-ac79-58a9610eb03d	fb215947-6393-428e-926a-ed7d0261ce52	Deduccion	ARGENTORES	10.00	6994000.00
af7c5da6-f7bb-4629-9834-be941cde85a4	3d7b1dfb-0c4f-4e88-a500-49fe8733a6a3	Gasto	DIRECCION	\N	158130.00
42e190ba-31f7-46cc-b47b-b041741e7e31	3d7b1dfb-0c4f-4e88-a500-49fe8733a6a3	Deduccion	ARGENTORES	10.00	527102.50
c1454d3a-0ea1-41d0-b2cd-cdec47441466	3d7b1dfb-0c4f-4e88-a500-49fe8733a6a3	Deduccion	AADET	\N	10542.05
d0fb63c1-111c-470a-932d-9553bc0e9f7b	3d7b1dfb-0c4f-4e88-a500-49fe8733a6a3	Deduccion	TICKETING	\N	9240.00
4315a11c-956a-430f-a8c8-2aca3d6f19ee	fb215947-6393-428e-926a-ed7d0261ce52	Deduccion	AADET	0.20	139880.00
a2fc39d3-5b9e-4ae7-b6df-2ef96004d915	8efa3aea-6271-40b6-ba33-ae3ef8ea6bb9	Deduccion	argentores	10.00	3450000.00
0c0a33d7-d44d-4a9b-9031-214fa62e3580	8efa3aea-6271-40b6-ba33-ae3ef8ea6bb9	Deduccion	aadet	0.20	69000.00
fe429c57-d62b-4935-88e7-c6bfb20c2096	8efa3aea-6271-40b6-ba33-ae3ef8ea6bb9	Deduccion	toketing	\N	6000.00
\.


--
-- Data for Name: LiquidacionReparto; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."LiquidacionReparto" (id, "liquidacionId", "nombreArtista", porcentaje, base, monto, "retencionAAA", created_at, "aplicaAAA") FROM stdin;
d3a3c62e-ebac-4c7f-b241-95863e2151ba	3d7b1dfb-0c4f-4e88-a500-49fe8733a6a3	Boy Olmi	70.00	Utilidad	2062892.27	\N	2026-02-17 19:19:39.548	f
ad62347d-05c0-4aac-bce4-5ad61d22a626	710636ae-4c2c-49a2-bf96-03079291da6f	pepe	6.00	Neta	1883106.00	\N	2026-02-17 23:10:56.081	t
ba03cf97-3d5f-43f4-8b79-210587115049	710636ae-4c2c-49a2-bf96-03079291da6f	pocho	8.00	Neta	2510808.00	\N	2026-02-17 23:10:56.081	t
0e40e4f8-aac6-4172-8367-a626fd1507fb	774ccf04-011e-4569-8b4b-2a1f497fd6f6	Boy Olmi	70.00	Utilidad	1459648.81	0.00	2026-02-17 23:29:07.579	f
f7af980c-ea37-4761-8ec7-1204c9c223a5	fb215947-6393-428e-926a-ed7d0261ce52	pepe	6.00	Neta	3768367.20	0.00	2026-02-17 23:47:55.426	t
9d3ab28b-f231-499b-bcd0-ba1831bc176d	fb215947-6393-428e-926a-ed7d0261ce52	pocho	8.00	Neta	5024489.60	0.00	2026-02-17 23:47:55.426	t
66cb07c1-8186-4db5-835d-173e783df146	8efa3aea-6271-40b6-ba33-ae3ef8ea6bb9	pepe	6.00	Neta	1858500.00	1000000.00	2026-02-18 00:13:38.755	t
d278fe7e-d90b-47a4-ad14-e4bc91a218d5	8efa3aea-6271-40b6-ba33-ae3ef8ea6bb9	pocho	8.00	Neta	2478000.00	0.00	2026-02-18 00:13:38.755	t
\.


--
-- Data for Name: LogisticaRuta; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."LogisticaRuta" (id, "funcionId", "comidasDetalle", "contactosLocales", "telProductorEjecutivo", "telProductorAsociado", "telTraslados", "telHoteles", "fechaEnvioRuta", created_at, updated_at, "alojamientoNoAplicaArtista", "alojamientoNoAplicaProduccion", "detalleTrasladoIdaArtista", "detalleTrasladoIdaProduccion", "detalleTrasladoVueltaArtista", "detalleTrasladoVueltaProduccion", "horarioCitacionArtista", "horarioEntradaSala", "hotelDireccionArtista", "hotelDireccionProduccion", "hotelNombreArtista", "hotelNombreProduccion", "linkFlyersRedes", "linkGraficaTicketera", "tipoTrasladoIdaArtista", "tipoTrasladoIdaProduccion", "tipoTrasladoVueltaArtista", "tipoTrasladoVueltaProduccion") FROM stdin;
b4d33d2d-a8d5-4a45-baf9-1419f285698e	ba492816-ab96-4fc8-a8ee-bb7bd310ebe3							\N	2026-02-09 18:58:57.304	2026-02-09 18:58:57.304	f	f											\N	\N				
\.


--
-- Data for Name: Mensaje; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Mensaje" (id, contenido, "autorId", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: Obra; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Obra" (id, nombre, "artistaPrincipal", descripcion, estado, "fechaEstreno", "productorEjecutivoId", created_at, updated_at, "driveFolderId") FROM stdin;
35dd8560-935f-41a3-87ac-d6d8580905ec	INTIMO	SEBASTIAN WAINRAICH		En Gira	\N	b154600a-7efb-40a2-8eb4-2e41790647f9	2026-02-09 22:47:46.23	2026-02-11 22:40:54.201	\N
b8da45d0-7434-4833-93a4-ce890e37d931	LIMBICO	ESTANISLAO BACHRACH		En Gira	\N	b154600a-7efb-40a2-8eb4-2e41790647f9	2026-02-09 22:16:43.543	2026-02-12 17:04:35.952	1QSpArr2MypQQtZ537SVVn5CzHznyM-I1
536dc9b9-1b71-4cf4-8dc1-d6710ba80eb4	BOY	BOY OLMI		En Gira	\N	b154600a-7efb-40a2-8eb4-2e41790647f9	2026-02-09 22:25:33.238	2026-02-17 16:02:42.121	1vbkarfUbAZOwsNscGukX3Bq7Ib_b_904
27e43cc5-63ae-4c72-b239-616b236cc462	Obra de Prueba Invitados	Artista Test		En Desarrollo	\N	b154600a-7efb-40a2-8eb4-2e41790647f9	2026-02-13 10:25:22.148	2026-02-17 22:55:39.468	\N
b4e09add-8efe-4145-8142-e40771e8e932	QUEMADO	FERNANDO SANJIAO		En Gira	2025-01-20 00:00:00	b154600a-7efb-40a2-8eb4-2e41790647f9	2026-02-09 16:56:47.603	2026-02-18 18:38:44.429	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."User" (id, email, "passwordHash", rol, nombre, apellido, telefono, "googleAccessToken", "googleRefreshToken", "googleTokenExpiry", activo, created_at, updated_at, "resetPasswordExpires", "resetPasswordToken") FROM stdin;
e1437024-9f35-48b3-8f32-4978722b16d1	isabelarela99@gmail.com	$2b$10$oELFOTYD9gbZcu5HdXeUcuK9fBrNEHZnztlm2YsLpEtGN9z.ukbJe	Productor	Prueba	User		\N	\N	\N	t	2026-02-12 14:06:37.493	2026-02-12 14:49:27.664	\N	\N
b154600a-7efb-40a2-8eb4-2e41790647f9	admin@hth.com	$2b$10$sib58j8F1.WKgfWs.8/nOue58o0Sc1U3gWfLvKd71rNYE.0dTeMEy	Admin	Admin	HTH	\N	ya29.a0AUMWg_L11tD9VvpiIbWF6eebeaccw3_r0rxYQT98-cJfeNqO1XDBWPXRoC3chgyHeIoBqYRbJgV-yi-iTEhKW2Py8yvobHeXiw7iONig3DsEEH_P8hOZqWuNmtfAkc8vtcVUc6VRwI-oFKGPfLWIQ5dbcF_RZd8qUuspSv8_zwTyui80XQtx6PogISCr85Zq6yLBAxCoaCgYKAY4SARUSFQHGX2MiJmi54utb-TBCGeZ6OKVULA0207	1//0h6Nk5lOUq-nVCgYIARAAGBESNwF-L9IrbpPPWZmr2vrAnGvCVOfQs5R6FLRxwec1HheUhYlYZzvmJ7Ae9XtGVwkpA7GFspg6BMA	2026-02-12 17:49:02.896	t	2026-02-09 16:08:46.211	2026-02-13 10:25:13.865	\N	\N
2a8bb553-c613-48af-8cf6-dcc1b341dd24	fersanjiao@gmail.com	$2b$10$ob8urf7224pLpe8QUdu.8O4QpKQf7ySIEqFiAtsM7YpnhYdJSf3RW	Artista	Fernando	Sanjiao		\N	\N	\N	t	2026-02-18 18:38:28.841	2026-02-18 18:38:28.841	\N	\N
67aa992d-0643-4466-9414-3a3758f40cf4	vanigibert@gmail.com	$2b$10$RrcFGfDoHknYoGNKMNqzZOJO844b1gONDXk/xgIU6tDbDSM/.fEgW	Administrador	Vanina 	Gibert		\N	\N	\N	t	2026-02-18 18:41:34.827	2026-02-18 18:41:34.827	\N	\N
61a30715-e722-41a3-b60d-8712256d8c46	ma.sclauzero@gmail.com	$2b$10$/4PuIjDT48XoIKtOTpNA2.BrZp6TElIX/Q822issWWislmtPSqZUG	Productor	Martina	Sclauzero		\N	\N	\N	t	2026-02-18 18:42:08.742	2026-02-18 18:42:08.742	\N	\N
82638f3e-e20c-487f-8ddb-10869b6d816f	daylongoni@gmail.com	$2b$10$mMikDXNaXUUiwoxdjrpLkO6mvFNHYAYu36g/sy26NPGchKTMwf/I.	Productor	Daiana	Longoni		\N	\N	\N	t	2026-02-18 18:42:37.791	2026-02-18 18:42:37.791	\N	\N
\.


--
-- Data for Name: Venta; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Venta" (id, "funcionId", "fechaRegistro", "tipoVenta", "entradasVendidas", "facturacionBruta", "canalVenta", created_at) FROM stdin;
57dbd0a9-ac25-4979-b568-5fe96d568d9a	ba492816-ab96-4fc8-a8ee-bb7bd310ebe3	2026-02-09 18:22:27.258	Venta Final	101	2525000.00	Ticketera	2026-02-09 18:22:27.259
f203078e-43fa-4650-bf70-02fc2ee1ab02	af58c906-c050-4cf3-a0ed-5e990d272cb8	2026-02-09 19:28:16.724	Venta Final	77	1925000.00	Ticketera	2026-02-09 19:28:16.727
a9669e4a-a16c-494b-a4d1-d30cd984afb2	6f73338f-e6de-491f-9ce6-44882bd9e421	2026-02-09 20:03:47.548	Venta Final	138	3940000.00	Ticketera	2026-02-09 20:03:47.553
1ad7223a-e1a6-448b-b55e-e2b3ffce9086	6f73338f-e6de-491f-9ce6-44882bd9e421	2026-02-09 20:05:07.959	Preventa	138	3940000.00	Ticketera	2026-02-09 20:05:07.977
83719b03-7b2a-4cef-aade-2ed692202672	5bfb9e51-8942-422f-a484-f13f575f0b4e	2026-02-09 22:20:51.051	Venta Final	762	35730000.00	Ticketera	2026-02-09 22:20:51.059
2bc0f9e2-5633-437b-8ed0-afe3faa61bb7	27e83d40-65b3-461c-a5f5-b3bccce9bda6	2026-02-09 22:52:13.583	Venta Final	1002	32550000.00	Ticketera	2026-02-09 22:52:13.586
21425c13-1d8c-4c79-8278-3606d1679ed2	905477d4-42b2-49e0-8997-04268c9989a0	2026-02-17 22:41:38.544	Venta Final	500	35000000.00	Ticketera	2026-02-17 22:41:38.546
a4e9b6cd-4152-43f4-9fa3-a9be524ddb58	905477d4-42b2-49e0-8997-04268c9989a0	2026-02-17 22:50:35.79	Venta Final	500	35000000.00	Ticketera	2026-02-17 22:50:35.799
9f96083b-b8d1-458e-a41d-f0019c68acef	905477d4-42b2-49e0-8997-04268c9989a0	2026-02-17 22:50:57.219	Preventa	500	35000000.00	Ticketera	2026-02-17 22:50:57.22
ea5346b6-2917-4c18-acc5-202d4d771085	1b17da64-4a51-4211-8184-1bf64e2e5681	2026-02-17 22:51:59.709	Venta Final	500	35000000.00	Ticketera	2026-02-17 22:51:59.719
81f34464-338c-46f4-a58a-c82b60d12829	d5121348-3b1f-49cd-94b0-4dc8b3319d45	2026-02-17 23:04:02.484	Preventa	700	70000000.00	Ticketera	2026-02-17 23:04:02.491
\.


--
-- Data for Name: _ArtistasEnObras; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."_ArtistasEnObras" ("A", "B") FROM stdin;
b4e09add-8efe-4145-8142-e40771e8e932	2a8bb553-c613-48af-8cf6-dcc1b341dd24
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
8aeea324-14a7-4032-bee7-6398ae33a8c0	5293d0dbaf88a47138bb1a69d93210b98f9a78aebb6b74ed0142073f7516ce1f	2026-02-12 18:03:15.937671+00	20260204003204_init	\N	\N	2026-02-12 18:03:15.728047+00	1
cc489cde-2c5f-4041-8641-72a473dbfa8a	db22c6e2a475c39b16ae2083afe08bf043c8a9eabe0a8f0e1d958090f692deb0	2026-02-12 18:03:16.037232+00	20260209160819_add_liquidacion_comprobantes	\N	\N	2026-02-12 18:03:15.943737+00	1
f0ba74ca-7f21-432c-abf3-f1a1c1c55923	f692b3f57b39b3f13df0e6bf5ea9b45316917dff0e17540db05a819b3c9ef57c	2026-02-12 18:03:16.10165+00	20260209170640_add_cascading_deletes	\N	\N	2026-02-12 18:03:16.043117+00	1
7f3654c7-c51d-47e5-b801-1f18821552fc	21aba734f110385a235c0b358e1dd4969c1f3114a5a237831a684c121f20521e	2026-02-12 18:03:16.187359+00	20260211152101_add_financial_fields_to_grupal	\N	\N	2026-02-12 18:03:16.108671+00	1
ac94cb67-32f9-493e-bb2a-2722f01c9b9a	198c20063521227a0ce910dc926aa399cff1e4ae275f9a47de50fc249654e597	2026-02-12 18:03:18.020291+00	20260212180317_add_reset_password_fields	\N	\N	2026-02-12 18:03:18.002713+00	1
80500d2f-4451-4eff-a0d1-d53876cf93e9	f07cc85fc176fb14935eca2366653c7582208bcbe51df504c3d8bdf391c205af	2026-02-13 10:20:16.097072+00	20260213102015_add_invitados	\N	\N	2026-02-13 10:20:16.02407+00	1
a95a38ff-32fd-4efb-bf5a-a746d0366426	9c387ea73233f00591b8e392b3577637d2999836e153a4474c14c8cf3f6874b1	2026-02-18 16:58:07.634378+00	20260218165807_add_many_to_many_artistas_obras	\N	\N	2026-02-18 16:58:07.413287+00	1
\.


--
-- Name: ArtistaPayout ArtistaPayout_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ArtistaPayout"
    ADD CONSTRAINT "ArtistaPayout_pkey" PRIMARY KEY (id);


--
-- Name: ChecklistTarea ChecklistTarea_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChecklistTarea"
    ADD CONSTRAINT "ChecklistTarea_pkey" PRIMARY KEY (id);


--
-- Name: Documento Documento_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Documento"
    ADD CONSTRAINT "Documento_pkey" PRIMARY KEY (id);


--
-- Name: Funcion Funcion_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Funcion"
    ADD CONSTRAINT "Funcion_pkey" PRIMARY KEY (id);


--
-- Name: Gasto Gasto_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Gasto"
    ADD CONSTRAINT "Gasto_pkey" PRIMARY KEY (id);


--
-- Name: Invitado Invitado_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Invitado"
    ADD CONSTRAINT "Invitado_pkey" PRIMARY KEY (id);


--
-- Name: LiquidacionGrupalItem LiquidacionGrupalItem_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."LiquidacionGrupalItem"
    ADD CONSTRAINT "LiquidacionGrupalItem_pkey" PRIMARY KEY (id);


--
-- Name: LiquidacionGrupal LiquidacionGrupal_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."LiquidacionGrupal"
    ADD CONSTRAINT "LiquidacionGrupal_pkey" PRIMARY KEY (id);


--
-- Name: LiquidacionItem LiquidacionItem_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."LiquidacionItem"
    ADD CONSTRAINT "LiquidacionItem_pkey" PRIMARY KEY (id);


--
-- Name: LiquidacionReparto LiquidacionReparto_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."LiquidacionReparto"
    ADD CONSTRAINT "LiquidacionReparto_pkey" PRIMARY KEY (id);


--
-- Name: Liquidacion Liquidacion_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Liquidacion"
    ADD CONSTRAINT "Liquidacion_pkey" PRIMARY KEY (id);


--
-- Name: LogisticaRuta LogisticaRuta_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."LogisticaRuta"
    ADD CONSTRAINT "LogisticaRuta_pkey" PRIMARY KEY (id);


--
-- Name: Mensaje Mensaje_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Mensaje"
    ADD CONSTRAINT "Mensaje_pkey" PRIMARY KEY (id);


--
-- Name: Obra Obra_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Obra"
    ADD CONSTRAINT "Obra_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Venta Venta_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Venta"
    ADD CONSTRAINT "Venta_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Liquidacion_funcionId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Liquidacion_funcionId_key" ON public."Liquidacion" USING btree ("funcionId");


--
-- Name: LogisticaRuta_funcionId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "LogisticaRuta_funcionId_key" ON public."LogisticaRuta" USING btree ("funcionId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: _ArtistasEnObras_AB_unique; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "_ArtistasEnObras_AB_unique" ON public."_ArtistasEnObras" USING btree ("A", "B");


--
-- Name: _ArtistasEnObras_B_index; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "_ArtistasEnObras_B_index" ON public."_ArtistasEnObras" USING btree ("B");


--
-- Name: ArtistaPayout ArtistaPayout_obraId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ArtistaPayout"
    ADD CONSTRAINT "ArtistaPayout_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES public."Obra"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChecklistTarea ChecklistTarea_funcionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChecklistTarea"
    ADD CONSTRAINT "ChecklistTarea_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES public."Funcion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChecklistTarea ChecklistTarea_obraId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChecklistTarea"
    ADD CONSTRAINT "ChecklistTarea_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES public."Obra"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChecklistTarea ChecklistTarea_responsableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChecklistTarea"
    ADD CONSTRAINT "ChecklistTarea_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Documento Documento_funcionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Documento"
    ADD CONSTRAINT "Documento_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES public."Funcion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Documento Documento_liquidacionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Documento"
    ADD CONSTRAINT "Documento_liquidacionId_fkey" FOREIGN KEY ("liquidacionId") REFERENCES public."Liquidacion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Documento Documento_obraId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Documento"
    ADD CONSTRAINT "Documento_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES public."Obra"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Documento Documento_subidoPorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Documento"
    ADD CONSTRAINT "Documento_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Funcion Funcion_obraId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Funcion"
    ADD CONSTRAINT "Funcion_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES public."Obra"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Funcion Funcion_productorAsociadoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Funcion"
    ADD CONSTRAINT "Funcion_productorAsociadoId_fkey" FOREIGN KEY ("productorAsociadoId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Gasto Gasto_comprobanteDocumentoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Gasto"
    ADD CONSTRAINT "Gasto_comprobanteDocumentoId_fkey" FOREIGN KEY ("comprobanteDocumentoId") REFERENCES public."Documento"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Gasto Gasto_funcionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Gasto"
    ADD CONSTRAINT "Gasto_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES public."Funcion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Gasto Gasto_obraId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Gasto"
    ADD CONSTRAINT "Gasto_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES public."Obra"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Invitado Invitado_funcionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Invitado"
    ADD CONSTRAINT "Invitado_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES public."Funcion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LiquidacionGrupalItem LiquidacionGrupalItem_grupalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."LiquidacionGrupalItem"
    ADD CONSTRAINT "LiquidacionGrupalItem_grupalId_fkey" FOREIGN KEY ("grupalId") REFERENCES public."LiquidacionGrupal"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LiquidacionItem LiquidacionItem_liquidacionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."LiquidacionItem"
    ADD CONSTRAINT "LiquidacionItem_liquidacionId_fkey" FOREIGN KEY ("liquidacionId") REFERENCES public."Liquidacion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LiquidacionReparto LiquidacionReparto_liquidacionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."LiquidacionReparto"
    ADD CONSTRAINT "LiquidacionReparto_liquidacionId_fkey" FOREIGN KEY ("liquidacionId") REFERENCES public."Liquidacion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Liquidacion Liquidacion_funcionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Liquidacion"
    ADD CONSTRAINT "Liquidacion_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES public."Funcion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Liquidacion Liquidacion_grupalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Liquidacion"
    ADD CONSTRAINT "Liquidacion_grupalId_fkey" FOREIGN KEY ("grupalId") REFERENCES public."LiquidacionGrupal"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LogisticaRuta LogisticaRuta_funcionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."LogisticaRuta"
    ADD CONSTRAINT "LogisticaRuta_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES public."Funcion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Mensaje Mensaje_autorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Mensaje"
    ADD CONSTRAINT "Mensaje_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Obra Obra_productorEjecutivoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Obra"
    ADD CONSTRAINT "Obra_productorEjecutivoId_fkey" FOREIGN KEY ("productorEjecutivoId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Venta Venta_funcionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Venta"
    ADD CONSTRAINT "Venta_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES public."Funcion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ArtistasEnObras _ArtistasEnObras_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."_ArtistasEnObras"
    ADD CONSTRAINT "_ArtistasEnObras_A_fkey" FOREIGN KEY ("A") REFERENCES public."Obra"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ArtistasEnObras _ArtistasEnObras_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."_ArtistasEnObras"
    ADD CONSTRAINT "_ArtistasEnObras_B_fkey" FOREIGN KEY ("B") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict aYhwUB78585NZfdIwUH73ade6zGrbA4caSf7lZro1tYomYAyDdX4v649fPa0eTn

