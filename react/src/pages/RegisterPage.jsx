import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import logo from "../images/logo.png";
import Dogs from "../images/Dogs.png";

// ── Philippine Zip Code Database (PHLPost) ─────────────────────────────────
const PHL_ZIP_DB = [
  // NCR — Manila
  ["NCR","Metro Manila","Binondo",1006],
  ["NCR","Metro Manila","Ermita",1000],
  ["NCR","Metro Manila","Intramuros",1002],
  ["NCR","Metro Manila","Malate",1004],
  ["NCR","Metro Manila","Paco",1007],
  ["NCR","Metro Manila","Pandacan",1011],
  ["NCR","Metro Manila","Port Area",1018],
  ["NCR","Metro Manila","Quiapo",1001],
  ["NCR","Metro Manila","Sampaloc",1008],
  ["NCR","Metro Manila","San Andres",1015],
  ["NCR","Metro Manila","San Miguel",1005],
  ["NCR","Metro Manila","San Nicolas",1010],
  ["NCR","Metro Manila","Santa Ana",1009],
  ["NCR","Metro Manila","Santa Cruz",1003],
  ["NCR","Metro Manila","Santa Mesa",1016],
  ["NCR","Metro Manila","Tondo",1013],
  // NCR — Makati
  ["NCR","Metro Manila","Makati CPO",1200],
  ["NCR","Metro Manila","Bel-Air",1209],
  ["NCR","Metro Manila","Cembo",1201],
  ["NCR","Metro Manila","Dasmariñas Village",1221],
  ["NCR","Metro Manila","Forbes Park",1219],
  ["NCR","Metro Manila","Guadalupe Nuevo",1212],
  ["NCR","Metro Manila","Guadalupe Viejo",1211],
  ["NCR","Metro Manila","Pio del Pilar",1230],
  ["NCR","Metro Manila","Poblacion Makati",1210],
  ["NCR","Metro Manila","Rockwell",1210],
  ["NCR","Metro Manila","San Lorenzo Village",1223],
  ["NCR","Metro Manila","Urdaneta Village",1222],
  // NCR — Quezon City
  ["NCR","Metro Manila","Quezon City CPO",1100],
  ["NCR","Metro Manila","Balara",1119],
  ["NCR","Metro Manila","Batasan Hills",1126],
  ["NCR","Metro Manila","Cubao",1109],
  ["NCR","Metro Manila","Diliman",1101],
  ["NCR","Metro Manila","Fairview",1118],
  ["NCR","Metro Manila","Kamuning",1103],
  ["NCR","Metro Manila","Kamias",1102],
  ["NCR","Metro Manila","Lagro",1116],
  ["NCR","Metro Manila","Novaliches",1123],
  ["NCR","Metro Manila","Pasong Tamo QC",1107],
  ["NCR","Metro Manila","Project 2 & 3",1102],
  ["NCR","Metro Manila","Project 4",1109],
  ["NCR","Metro Manila","Project 6",1100],
  ["NCR","Metro Manila","Project 7",1105],
  ["NCR","Metro Manila","Project 8",1106],
  ["NCR","Metro Manila","Sauyo",1116],
  ["NCR","Metro Manila","Tandang Sora",1116],
  ["NCR","Metro Manila","Teachers Village",1101],
  ["NCR","Metro Manila","UP Village",1101],
  ["NCR","Metro Manila","West Triangle",1104],
  ["NCR","Metro Manila","Holy Spirit",1127],
  ["NCR","Metro Manila","Payatas",1119],
  ["NCR","Metro Manila","Commonwealth",1121],
  ["NCR","Metro Manila","Bagumbayan",1110],
  ["NCR","Metro Manila","Bagong Silangan",1124],
  ["NCR","Metro Manila","Claro",1101],
  // NCR — Caloocan
  ["NCR","Metro Manila","Caloocan CPO",1400],
  ["NCR","Metro Manila","Bagong Barrio",1400],
  ["NCR","Metro Manila","EDSA Caloocan",1403],
  ["NCR","Metro Manila","Grace Park",1403],
  ["NCR","Metro Manila","Maypajo",1406],
  ["NCR","Metro Manila","Pasong Putik",1404],
  ["NCR","Metro Manila","Deparo",1409],
  ["NCR","Metro Manila","Camarin",1422],
  ["NCR","Metro Manila","Bagumbong",1421],
  // NCR — Malabon, Navotas, Valenzuela
  ["NCR","Metro Manila","Malabon CPO",1470],
  ["NCR","Metro Manila","Navotas CPO",1485],
  ["NCR","Metro Manila","Valenzuela CPO",1440],
  ["NCR","Metro Manila","Karuhatan",1441],
  ["NCR","Metro Manila","Lingunan",1446],
  ["NCR","Metro Manila","Mapulang Lupa",1448],
  ["NCR","Metro Manila","Malinta CPO",1440],
  // NCR — Pasay, Pasig, Mandaluyong
  ["NCR","Metro Manila","Pasay CPO",1300],
  ["NCR","Metro Manila","Pasig CPO",1600],
  ["NCR","Metro Manila","Pasig Kapitolyo",1603],
  ["NCR","Metro Manila","Ortigas Center",1605],
  ["NCR","Metro Manila","Mandaluyong CPO",1550],
  ["NCR","Metro Manila","Mandaluyong Wack-Wack",1555],
  // NCR — Marikina, San Juan
  ["NCR","Metro Manila","Marikina CPO",1800],
  ["NCR","Metro Manila","Marikina Concepcion",1810],
  ["NCR","Metro Manila","San Juan CPO",1500],
  ["NCR","Metro Manila","Greenhills",1502],
  ["NCR","Metro Manila","Eisenhower-Crame",1504],
  // NCR — Parañaque, Las Piñas, Muntinlupa
  ["NCR","Metro Manila","Parañaque CPO",1700],
  ["NCR","Metro Manila","BF Homes Parañaque",1720],
  ["NCR","Metro Manila","Sto. Niño Parañaque",1709],
  ["NCR","Metro Manila","Las Piñas CPO",1740],
  ["NCR","Metro Manila","Muntinlupa CPO",1770],
  ["NCR","Metro Manila","Alabang",1771],
  ["NCR","Metro Manila","Sucat",1767],
  // NCR — Taguig, Pateros
  ["NCR","Metro Manila","Taguig CPO",1630],
  ["NCR","Metro Manila","Bonifacio Global City",1635],
  ["NCR","Metro Manila","Fort Bonifacio",1634],
  ["NCR","Metro Manila","Ususan",1639],
  ["NCR","Metro Manila","Pateros CPO",1620],
  // Region 4A — Laguna
  ["Region 4A (CALABARZON)","Laguna","Biñan",4024],
  ["Region 4A (CALABARZON)","Laguna","Calamba",4027],
  ["Region 4A (CALABARZON)","Laguna","San Pedro",4023],
  ["Region 4A (CALABARZON)","Laguna","Sta. Rosa",4026],
  ["Region 4A (CALABARZON)","Laguna","Cabuyao",4025],
  ["Region 4A (CALABARZON)","Laguna","Los Baños",4030],
  ["Region 4A (CALABARZON)","Laguna","Bay",4033],
  ["Region 4A (CALABARZON)","Laguna","Calauan",4012],
  ["Region 4A (CALABARZON)","Laguna","Lumban",4035],
  ["Region 4A (CALABARZON)","Laguna","Majayjay",4015],
  ["Region 4A (CALABARZON)","Laguna","Nagcarlan",4009],
  ["Region 4A (CALABARZON)","Laguna","Paete",4016],
  ["Region 4A (CALABARZON)","Laguna","Pakil",4017],
  ["Region 4A (CALABARZON)","Laguna","Pangil",4018],
  ["Region 4A (CALABARZON)","Laguna","San Pablo",4000],
  ["Region 4A (CALABARZON)","Laguna","Siniloan",4019],
  ["Region 4A (CALABARZON)","Laguna","Victoria",4012],
  ["Region 4A (CALABARZON)","Laguna","Liliw",4004],
  ["Region 4A (CALABARZON)","Laguna","Magdalena",4007],
  ["Region 4A (CALABARZON)","Laguna","Mabitac",4010],
  ["Region 4A (CALABARZON)","Laguna","Cavinti",4013],
  ["Region 4A (CALABARZON)","Laguna","Famy",4021],
  ["Region 4A (CALABARZON)","Laguna","Kalayaan",4020],
  // Region 4A — Cavite
  ["Region 4A (CALABARZON)","Cavite","Cavite City",4100],
  ["Region 4A (CALABARZON)","Cavite","Bacoor",4102],
  ["Region 4A (CALABARZON)","Cavite","Imus",4103],
  ["Region 4A (CALABARZON)","Cavite","Dasmariñas",4114],
  ["Region 4A (CALABARZON)","Cavite","General Trias",4107],
  ["Region 4A (CALABARZON)","Cavite","Tagaytay",4120],
  ["Region 4A (CALABARZON)","Cavite","Trece Martires",4109],
  ["Region 4A (CALABARZON)","Cavite","Silang",4118],
  ["Region 4A (CALABARZON)","Cavite","Carmona",4116],
  ["Region 4A (CALABARZON)","Cavite","Naic",4110],
  ["Region 4A (CALABARZON)","Cavite","Kawit",4104],
  ["Region 4A (CALABARZON)","Cavite","Noveleta",4105],
  ["Region 4A (CALABARZON)","Cavite","Rosario Cavite",4106],
  ["Region 4A (CALABARZON)","Cavite","Alfonso",4123],
  ["Region 4A (CALABARZON)","Cavite","Amadeo",4119],
  ["Region 4A (CALABARZON)","Cavite","Indang",4122],
  ["Region 4A (CALABARZON)","Cavite","Magallanes",4112],
  ["Region 4A (CALABARZON)","Cavite","Maragondon",4113],
  ["Region 4A (CALABARZON)","Cavite","Mendez",4121],
  ["Region 4A (CALABARZON)","Cavite","Ternate",4111],
  ["Region 4A (CALABARZON)","Cavite","Gen. Emilio Aguinaldo",4117],
  // Region 4A — Rizal
  ["Region 4A (CALABARZON)","Rizal","Antipolo",1870],
  ["Region 4A (CALABARZON)","Rizal","Cainta",1900],
  ["Region 4A (CALABARZON)","Rizal","Taytay",1920],
  ["Region 4A (CALABARZON)","Rizal","Angono",1930],
  ["Region 4A (CALABARZON)","Rizal","Binangonan",1940],
  ["Region 4A (CALABARZON)","Rizal","Rodriguez (Montalban)",1860],
  ["Region 4A (CALABARZON)","Rizal","San Mateo",1850],
  ["Region 4A (CALABARZON)","Rizal","Tanay",1980],
  ["Region 4A (CALABARZON)","Rizal","Teresa",1880],
  ["Region 4A (CALABARZON)","Rizal","Morong",1960],
  ["Region 4A (CALABARZON)","Rizal","Baras",1970],
  ["Region 4A (CALABARZON)","Rizal","Cardona",1950],
  ["Region 4A (CALABARZON)","Rizal","Jala-Jala",1990],
  ["Region 4A (CALABARZON)","Rizal","Pililla",1910],
  // Region 4A — Batangas
  ["Region 4A (CALABARZON)","Batangas","Batangas City",4200],
  ["Region 4A (CALABARZON)","Batangas","Lipa",4217],
  ["Region 4A (CALABARZON)","Batangas","Tanauan",4232],
  ["Region 4A (CALABARZON)","Batangas","Sto. Tomas Batangas",4234],
  ["Region 4A (CALABARZON)","Batangas","Calaca",4212],
  ["Region 4A (CALABARZON)","Batangas","Calatagan",4215],
  ["Region 4A (CALABARZON)","Batangas","Ibaan",4230],
  ["Region 4A (CALABARZON)","Batangas","Lemery",4209],
  ["Region 4A (CALABARZON)","Batangas","Nasugbu",4231],
  ["Region 4A (CALABARZON)","Batangas","Rosario Batangas",4225],
  ["Region 4A (CALABARZON)","Batangas","San Juan Batangas",4226],
  ["Region 4A (CALABARZON)","Batangas","San Pascual",4204],
  ["Region 4A (CALABARZON)","Batangas","Taal",4208],
  ["Region 4A (CALABARZON)","Batangas","Taysan",4221],
  ["Region 4A (CALABARZON)","Batangas","Tingloy",4202],
  // Region 4A — Quezon
  ["Region 4A (CALABARZON)","Quezon","Lucena",4301],
  ["Region 4A (CALABARZON)","Quezon","Tayabas",4327],
  ["Region 4A (CALABARZON)","Quezon","Candelaria",4323],
  ["Region 4A (CALABARZON)","Quezon","Sariaya",4322],
  ["Region 4A (CALABARZON)","Quezon","Tiaong",4325],
  ["Region 4A (CALABARZON)","Quezon","Pagbilao",4302],
  ["Region 4A (CALABARZON)","Quezon","Atimonan",4331],
  ["Region 4A (CALABARZON)","Quezon","Gumaca",4307],
  ["Region 4A (CALABARZON)","Quezon","Lopez",4316],
  ["Region 4A (CALABARZON)","Quezon","Infanta",4336],
  ["Region 4A (CALABARZON)","Quezon","Real",4335],
  // Region 3 — Bulacan
  ["Region 3 (Central Luzon)","Bulacan","Malolos",3000],
  ["Region 3 (Central Luzon)","Bulacan","Meycauayan",3020],
  ["Region 3 (Central Luzon)","Bulacan","Marilao",3019],
  ["Region 3 (Central Luzon)","Bulacan","Bocaue",3018],
  ["Region 3 (Central Luzon)","Bulacan","Balagtas",3016],
  ["Region 3 (Central Luzon)","Bulacan","Guiguinto",3015],
  ["Region 3 (Central Luzon)","Bulacan","San Jose del Monte",3023],
  ["Region 3 (Central Luzon)","Bulacan","Calumpit",3003],
  ["Region 3 (Central Luzon)","Bulacan","Hagonoy",3002],
  ["Region 3 (Central Luzon)","Bulacan","Plaridel",3004],
  ["Region 3 (Central Luzon)","Bulacan","Pulilan",3005],
  ["Region 3 (Central Luzon)","Bulacan","San Ildefonso",3010],
  ["Region 3 (Central Luzon)","Bulacan","San Miguel Bulacan",3011],
  ["Region 3 (Central Luzon)","Bulacan","San Rafael",3008],
  ["Region 3 (Central Luzon)","Bulacan","Santa Maria Bulacan",3022],
  ["Region 3 (Central Luzon)","Bulacan","Angat",3012],
  ["Region 3 (Central Luzon)","Bulacan","Baliuag",3006],
  ["Region 3 (Central Luzon)","Bulacan","Bustos",3007],
  ["Region 3 (Central Luzon)","Bulacan","Norzagaray",3013],
  ["Region 3 (Central Luzon)","Bulacan","Obando",3021],
  ["Region 3 (Central Luzon)","Bulacan","Paombong",3001],
  ["Region 3 (Central Luzon)","Bulacan","Pandi",3014],
  // Region 3 — Pampanga
  ["Region 3 (Central Luzon)","Pampanga","San Fernando",2000],
  ["Region 3 (Central Luzon)","Pampanga","Angeles",2009],
  ["Region 3 (Central Luzon)","Pampanga","Mabalacat",2010],
  ["Region 3 (Central Luzon)","Pampanga","Mexico",2021],
  ["Region 3 (Central Luzon)","Pampanga","Apalit",2016],
  ["Region 3 (Central Luzon)","Pampanga","Macabebe",2018],
  ["Region 3 (Central Luzon)","Pampanga","Guagua",2003],
  ["Region 3 (Central Luzon)","Pampanga","Lubao",2005],
  ["Region 3 (Central Luzon)","Pampanga","Porac",2008],
  ["Region 3 (Central Luzon)","Pampanga","Floridablanca",2006],
  ["Region 3 (Central Luzon)","Pampanga","Magalang",2011],
  ["Region 3 (Central Luzon)","Pampanga","Bacolor",2001],
  ["Region 3 (Central Luzon)","Pampanga","Candaba",2013],
  ["Region 3 (Central Luzon)","Pampanga","Masantol",2017],
  ["Region 3 (Central Luzon)","Pampanga","Minalin",2019],
  ["Region 3 (Central Luzon)","Pampanga","Sto. Tomas Pampanga",2020],
  ["Region 3 (Central Luzon)","Pampanga","San Luis Pampanga",2014],
  ["Region 3 (Central Luzon)","Pampanga","San Simon",2015],
  // Region 3 — Nueva Ecija
  ["Region 3 (Central Luzon)","Nueva Ecija","Cabanatuan",3100],
  ["Region 3 (Central Luzon)","Nueva Ecija","Palayan",3132],
  ["Region 3 (Central Luzon)","Nueva Ecija","San Jose Nueva Ecija",3121],
  ["Region 3 (Central Luzon)","Nueva Ecija","Gapan",3105],
  ["Region 3 (Central Luzon)","Nueva Ecija","Munoz",3119],
  ["Region 3 (Central Luzon)","Nueva Ecija","Talavera",3114],
  ["Region 3 (Central Luzon)","Nueva Ecija","Guimba",3115],
  ["Region 3 (Central Luzon)","Nueva Ecija","Aliaga",3111],
  ["Region 3 (Central Luzon)","Nueva Ecija","Bongabon",3128],
  // Region 3 — Bataan
  ["Region 3 (Central Luzon)","Bataan","Balanga",2100],
  ["Region 3 (Central Luzon)","Bataan","Dinalupihan",2110],
  ["Region 3 (Central Luzon)","Bataan","Hermosa",2111],
  ["Region 3 (Central Luzon)","Bataan","Orani",2112],
  ["Region 3 (Central Luzon)","Bataan","Abucay",2114],
  ["Region 3 (Central Luzon)","Bataan","Bagac",2107],
  ["Region 3 (Central Luzon)","Bataan","Mariveles",2105],
  // Region 3 — Tarlac
  ["Region 3 (Central Luzon)","Tarlac","Tarlac City",2300],
  ["Region 3 (Central Luzon)","Tarlac","Capas",2315],
  ["Region 3 (Central Luzon)","Tarlac","Paniqui",2307],
  ["Region 3 (Central Luzon)","Tarlac","Concepcion Tarlac",2316],
  ["Region 3 (Central Luzon)","Tarlac","Camiling",2306],
  ["Region 3 (Central Luzon)","Tarlac","Gerona",2302],
  // Region 3 — Zambales
  ["Region 3 (Central Luzon)","Zambales","Olongapo",2200],
  ["Region 3 (Central Luzon)","Zambales","Iba",2201],
  ["Region 3 (Central Luzon)","Zambales","San Antonio Zambales",2206],
  ["Region 3 (Central Luzon)","Zambales","Subic",2209],
  ["Region 3 (Central Luzon)","Zambales","San Narciso",2205],
  // Region 3 — Aurora
  ["Region 3 (Central Luzon)","Aurora","Baler",3200],
  ["Region 3 (Central Luzon)","Aurora","Casiguran",3204],
  // Region 1 — Pangasinan
  ["Region 1 (Ilocos Region)","Pangasinan","Dagupan",2400],
  ["Region 1 (Ilocos Region)","Pangasinan","Alaminos",2404],
  ["Region 1 (Ilocos Region)","Pangasinan","Urdaneta",2428],
  ["Region 1 (Ilocos Region)","Pangasinan","Lingayen",2401],
  ["Region 1 (Ilocos Region)","Pangasinan","San Carlos Pangasinan",2420],
  ["Region 1 (Ilocos Region)","Pangasinan","Anda",2405],
  ["Region 1 (Ilocos Region)","Pangasinan","Agno",2408],
  ["Region 1 (Ilocos Region)","Pangasinan","Aguilar",2415],
  ["Region 1 (Ilocos Region)","Pangasinan","Alcala",2425],
  ["Region 1 (Ilocos Region)","Pangasinan","Binmaley",2417],
  ["Region 1 (Ilocos Region)","Pangasinan","Bugallon",2419],
  ["Region 1 (Ilocos Region)","Pangasinan","Calasiao",2418],
  ["Region 1 (Ilocos Region)","Pangasinan","Mangatarem",2413],
  ["Region 1 (Ilocos Region)","Pangasinan","Pozorrubio",2424],
  ["Region 1 (Ilocos Region)","Pangasinan","Rosales",2441],
  ["Region 1 (Ilocos Region)","Pangasinan","San Fabian",2433],
  // Region 1 — La Union
  ["Region 1 (Ilocos Region)","La Union","San Fernando City",2500],
  ["Region 1 (Ilocos Region)","La Union","Bauang",2501],
  ["Region 1 (Ilocos Region)","La Union","Agoo",2504],
  ["Region 1 (Ilocos Region)","La Union","Aringay",2503],
  ["Region 1 (Ilocos Region)","La Union","Bacnotan",2515],
  ["Region 1 (Ilocos Region)","La Union","Balaoan",2517],
  ["Region 1 (Ilocos Region)","La Union","Bangar",2519],
  ["Region 1 (Ilocos Region)","La Union","Burgos La Union",2510],
  ["Region 1 (Ilocos Region)","La Union","Luna La Union",2518],
  ["Region 1 (Ilocos Region)","La Union","Naguilian",2511],
  ["Region 1 (Ilocos Region)","La Union","Rosario La Union",2506],
  ["Region 1 (Ilocos Region)","La Union","San Juan La Union",2514],
  ["Region 1 (Ilocos Region)","La Union","Santo Tomas La Union",2505],
  // Region 1 — Ilocos Norte
  ["Region 1 (Ilocos Region)","Ilocos Norte","Laoag City",2900],
  ["Region 1 (Ilocos Region)","Ilocos Norte","Batac",2906],
  ["Region 1 (Ilocos Region)","Ilocos Norte","Paoay",2902],
  ["Region 1 (Ilocos Region)","Ilocos Norte","Pagudpud",2919],
  ["Region 1 (Ilocos Region)","Ilocos Norte","Sarrat",2914],
  ["Region 1 (Ilocos Region)","Ilocos Norte","Vintar",2915],
  ["Region 1 (Ilocos Region)","Ilocos Norte","Dingras",2913],
  ["Region 1 (Ilocos Region)","Ilocos Norte","Pasuquin",2917],
  // Region 1 — Ilocos Sur
  ["Region 1 (Ilocos Region)","Ilocos Sur","Vigan",2700],
  ["Region 1 (Ilocos Region)","Ilocos Sur","Candon",2710],
  ["Region 1 (Ilocos Region)","Ilocos Sur","Narvacan",2704],
  ["Region 1 (Ilocos Region)","Ilocos Sur","Santa",2703],
  ["Region 1 (Ilocos Region)","Ilocos Sur","Tagudin",2714],
  ["Region 1 (Ilocos Region)","Ilocos Sur","Bantay",2727],
  ["Region 1 (Ilocos Region)","Ilocos Sur","Cabugao",2732],
  ["Region 1 (Ilocos Region)","Ilocos Sur","Magsingal",2730],
  ["Region 1 (Ilocos Region)","Ilocos Sur","Santa Lucia",2712],
  // Region 2 — Cagayan Valley
  ["Region 2 (Cagayan Valley)","Cagayan","Tuguegarao",3500],
  ["Region 2 (Cagayan Valley)","Cagayan","Aparri",3515],
  ["Region 2 (Cagayan Valley)","Cagayan","Gonzaga",3513],
  ["Region 2 (Cagayan Valley)","Isabela","Ilagan",3300],
  ["Region 2 (Cagayan Valley)","Isabela","Santiago",3311],
  ["Region 2 (Cagayan Valley)","Isabela","Cauayan",3305],
  ["Region 2 (Cagayan Valley)","Isabela","Tumauini",3325],
  ["Region 2 (Cagayan Valley)","Nueva Vizcaya","Bayombong",3700],
  ["Region 2 (Cagayan Valley)","Nueva Vizcaya","Solano",3709],
  ["Region 2 (Cagayan Valley)","Quirino","Cabarroguis",3400],
  ["Region 2 (Cagayan Valley)","Batanes","Basco",3900],
  // CAR
  ["CAR (Cordillera)","Benguet","Baguio",2600],
  ["CAR (Cordillera)","Benguet","La Trinidad",2601],
  ["CAR (Cordillera)","Benguet","Itogon",2604],
  ["CAR (Cordillera)","Benguet","Tublay",2607],
  ["CAR (Cordillera)","Ifugao","Lagawe",3600],
  ["CAR (Cordillera)","Ifugao","Banaue",3601],
  ["CAR (Cordillera)","Mountain Province","Bontoc",2616],
  ["CAR (Cordillera)","Kalinga","Tabuk",3800],
  ["CAR (Cordillera)","Abra","Bangued",2800],
  ["CAR (Cordillera)","Apayao","Kabugao",3814],
  // Region 4B — MIMAROPA
  ["Region 4B (MIMAROPA)","Palawan","Puerto Princesa",5300],
  ["Region 4B (MIMAROPA)","Palawan","Coron",5316],
  ["Region 4B (MIMAROPA)","Palawan","El Nido",5313],
  ["Region 4B (MIMAROPA)","Occidental Mindoro","Mamburao",5106],
  ["Region 4B (MIMAROPA)","Oriental Mindoro","Calapan",5200],
  ["Region 4B (MIMAROPA)","Marinduque","Boac",4900],
  ["Region 4B (MIMAROPA)","Romblon","Romblon",5500],
  // Region 5 — Bicol
  ["Region 5 (Bicol)","Camarines Sur","Naga",4400],
  ["Region 5 (Bicol)","Camarines Sur","Iriga",4431],
  ["Region 5 (Bicol)","Camarines Sur","Pili",4418],
  ["Region 5 (Bicol)","Camarines Norte","Daet",4600],
  ["Region 5 (Bicol)","Albay","Legazpi",4500],
  ["Region 5 (Bicol)","Albay","Ligao",4504],
  ["Region 5 (Bicol)","Albay","Tabaco",4511],
  ["Region 5 (Bicol)","Sorsogon","Sorsogon City",4700],
  ["Region 5 (Bicol)","Catanduanes","Virac",4800],
  ["Region 5 (Bicol)","Masbate","Masbate City",5400],
  // Region 6 — Western Visayas
  ["Region 6 (Western Visayas)","Iloilo","Iloilo City",5000],
  ["Region 6 (Western Visayas)","Iloilo","Passi",5037],
  ["Region 6 (Western Visayas)","Iloilo","Pototan",5008],
  ["Region 6 (Western Visayas)","Iloilo","Dumangas",5006],
  ["Region 6 (Western Visayas)","Iloilo","Lambunao",5012],
  ["Region 6 (Western Visayas)","Capiz","Roxas City",5800],
  ["Region 6 (Western Visayas)","Capiz","Sigma",5815],
  ["Region 6 (Western Visayas)","Aklan","Kalibo",5600],
  ["Region 6 (Western Visayas)","Aklan","Malay (Boracay area)",5608],
  ["Region 6 (Western Visayas)","Antique","San Jose de Buenavista",5700],
  ["Region 6 (Western Visayas)","Guimaras","Jordan",5044],
  ["Region 6 (Western Visayas)","Negros Occidental","Bacolod",6100],
  ["Region 6 (Western Visayas)","Negros Occidental","Silay",6116],
  ["Region 6 (Western Visayas)","Negros Occidental","Talisay Negros Occ",6115],
  ["Region 6 (Western Visayas)","Negros Occidental","Bago",6101],
  ["Region 6 (Western Visayas)","Negros Occidental","Cadiz",6121],
  ["Region 6 (Western Visayas)","Negros Occidental","Kabankalan",6111],
  ["Region 6 (Western Visayas)","Negros Occidental","La Carlota",6130],
  ["Region 6 (Western Visayas)","Negros Occidental","Sagay",6122],
  ["Region 6 (Western Visayas)","Negros Occidental","San Carlos Negros Occ",6127],
  // Region 7 — Central Visayas
  ["Region 7 (Central Visayas)","Cebu","Cebu City",6000],
  ["Region 7 (Central Visayas)","Cebu","Mandaue",6014],
  ["Region 7 (Central Visayas)","Cebu","Lapu-Lapu",6015],
  ["Region 7 (Central Visayas)","Cebu","Danao",6004],
  ["Region 7 (Central Visayas)","Cebu","Talisay Cebu",6045],
  ["Region 7 (Central Visayas)","Cebu","Toledo",6038],
  ["Region 7 (Central Visayas)","Cebu","Naga Cebu",6037],
  ["Region 7 (Central Visayas)","Cebu","Carcar",6019],
  ["Region 7 (Central Visayas)","Cebu","Consolacion",6001],
  ["Region 7 (Central Visayas)","Cebu","Liloan Cebu",6002],
  ["Region 7 (Central Visayas)","Cebu","Minglanilla",6046],
  ["Region 7 (Central Visayas)","Cebu","San Fernando Cebu",6018],
  ["Region 7 (Central Visayas)","Bohol","Tagbilaran",6300],
  ["Region 7 (Central Visayas)","Bohol","Tubigon",6329],
  ["Region 7 (Central Visayas)","Bohol","Ubay",6319],
  ["Region 7 (Central Visayas)","Negros Oriental","Dumaguete",6200],
  ["Region 7 (Central Visayas)","Negros Oriental","Bayawan",6221],
  ["Region 7 (Central Visayas)","Negros Oriental","Canlaon",6223],
  ["Region 7 (Central Visayas)","Negros Oriental","Guihulngan",6214],
  ["Region 7 (Central Visayas)","Siquijor","Siquijor",6225],
  // Region 8 — Eastern Visayas
  ["Region 8 (Eastern Visayas)","Leyte","Tacloban",6500],
  ["Region 8 (Eastern Visayas)","Leyte","Ormoc",6541],
  ["Region 8 (Eastern Visayas)","Leyte","Baybay",6521],
  ["Region 8 (Eastern Visayas)","Leyte","Palo",6501],
  ["Region 8 (Eastern Visayas)","Southern Leyte","Maasin",6600],
  ["Region 8 (Eastern Visayas)","Samar","Catbalogan",6700],
  ["Region 8 (Eastern Visayas)","Eastern Samar","Borongan",6800],
  ["Region 8 (Eastern Visayas)","Northern Samar","Catarman",6400],
  ["Region 8 (Eastern Visayas)","Biliran","Naval",6543],
  // Region 9 — Zamboanga Peninsula
  ["Region 9 (Zamboanga)","Zamboanga City","Zamboanga City",7000],
  ["Region 9 (Zamboanga)","Zamboanga del Norte","Dipolog",7100],
  ["Region 9 (Zamboanga)","Zamboanga del Norte","Dapitan",7101],
  ["Region 9 (Zamboanga)","Zamboanga del Sur","Pagadian",7016],
  ["Region 9 (Zamboanga)","Zamboanga Sibugay","Ipil",7001],
  // Region 10 — Northern Mindanao
  ["Region 10 (Northern Mindanao)","Misamis Oriental","Cagayan de Oro",9000],
  ["Region 10 (Northern Mindanao)","Misamis Oriental","Gingoog",9014],
  ["Region 10 (Northern Mindanao)","Misamis Occidental","Ozamiz",7200],
  ["Region 10 (Northern Mindanao)","Misamis Occidental","Oroquieta",7207],
  ["Region 10 (Northern Mindanao)","Bukidnon","Malaybalay",8700],
  ["Region 10 (Northern Mindanao)","Bukidnon","Valencia Bukidnon",8709],
  ["Region 10 (Northern Mindanao)","Lanao del Norte","Iligan",9200],
  ["Region 10 (Northern Mindanao)","Camiguin","Mambajao",9100],
  // Region 11 — Davao
  ["Region 11 (Davao)","Davao del Sur","Davao City",8000],
  ["Region 11 (Davao)","Davao del Norte","Tagum",8100],
  ["Region 11 (Davao)","Davao del Norte","Panabo",8105],
  ["Region 11 (Davao)","Davao Oriental","Mati",8200],
  ["Region 11 (Davao)","Davao de Oro","Nabunturan",8800],
  ["Region 11 (Davao)","Davao Occidental","Digos",8002],
  // Region 12 — SOCCSKSARGEN
  ["Region 12 (SOCCSKSARGEN)","South Cotabato","General Santos",9500],
  ["Region 12 (SOCCSKSARGEN)","South Cotabato","Koronadal",9506],
  ["Region 12 (SOCCSKSARGEN)","South Cotabato","Polomolok",9504],
  ["Region 12 (SOCCSKSARGEN)","North Cotabato","Kidapawan",9400],
  ["Region 12 (SOCCSKSARGEN)","North Cotabato","Midsayap",9410],
  ["Region 12 (SOCCSKSARGEN)","Sultan Kudarat","Isulan",9805],
  ["Region 12 (SOCCSKSARGEN)","Sultan Kudarat","Tacurong",9800],
  ["Region 12 (SOCCSKSARGEN)","Sarangani","Alabel",9501],
  // BARMM
  ["BARMM","Maguindanao del Norte","Cotabato City",9600],
  ["BARMM","Maguindanao del Norte","Datu Odin Sinsuat",9611],
  ["BARMM","Maguindanao del Sur","Buluan",9611],
  ["BARMM","Lanao del Sur","Marawi",9700],
  ["BARMM","Basilan","Isabela City",7300],
  ["BARMM","Sulu","Jolo",7400],
  ["BARMM","Tawi-Tawi","Bongao",7500],
  // Region 13 — Caraga
  ["Region 13 (Caraga)","Agusan del Norte","Butuan",8600],
  ["Region 13 (Caraga)","Agusan del Norte","Cabadbaran",8605],
  ["Region 13 (Caraga)","Agusan del Sur","Bayugan",8502],
  ["Region 13 (Caraga)","Agusan del Sur","Prosperidad",8700],
  ["Region 13 (Caraga)","Surigao del Norte","Surigao City",8400],
  ["Region 13 (Caraga)","Surigao del Sur","Tandag",8300],
  ["Region 13 (Caraga)","Surigao del Sur","Bislig",8311],
  ["Region 13 (Caraga)","Dinagat Islands","San Jose Dinagat",8420],
];

function lookupZip(city) {
  if (!city || city.trim().length < 2) return [];
  const q = city.toLowerCase();
  return PHL_ZIP_DB.filter(r => r[2].toLowerCase().includes(q));
}

// ── Background ─────────────────────────────────────────────────────────────
function MeshBackground() {
  const orbRefs = useRef([]);
  const mouse = useRef({ mx:0, my:0, cx:0, cy:0 });
  const factors = [
    { fx:0.10,fy:0.07 },{ fx:-0.12,fy:0.09 },{ fx:0.14,fy:-0.08 },
    { fx:-0.08,fy:-0.11 },{ fx:0.09,fy:0.13 },{ fx:-0.13,fy:0.07 },
  ];
  useEffect(() => {
    const onMove = (e) => {
      mouse.current.mx = (e.clientX/window.innerWidth  - 0.5)*80;
      mouse.current.my = (e.clientY/window.innerHeight - 0.5)*80;
    };
    window.addEventListener("mousemove", onMove);
    let raf;
    const animate = () => {
      const m = mouse.current;
      m.cx += (m.mx - m.cx)*0.08; m.cy += (m.my - m.cy)*0.08;
      orbRefs.current.forEach((el,i) => {
        if (el) { el.style.marginLeft = m.cx*factors[i].fx+"px"; el.style.marginTop = m.cy*factors[i].fy+"px"; }
      });
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => { window.removeEventListener("mousemove",onMove); cancelAnimationFrame(raf); };
  }, []);

  const orbs = [
    { w:1100,h:1100,top:"-25%",left:"-20%",  bg:"radial-gradient(circle,#588B41 0%,transparent 70%)",anim:"float1 8s ease-in-out infinite" },
    { w:1000,h:1000,top:"10%", right:"-20%", bg:"radial-gradient(circle,#B45A22 0%,transparent 70%)",anim:"float2 10s ease-in-out infinite" },
    { w:950, h:950, bottom:"-20%",left:"10%",bg:"radial-gradient(circle,#e8e0d0 0%,transparent 60%)",anim:"float3 7s ease-in-out infinite" },
    { w:900, h:900, top:"30%", left:"25%",   bg:"radial-gradient(circle,#588B41 0%,transparent 70%)",anim:"float4 9s ease-in-out infinite" },
    { w:850, h:850, bottom:"0%",right:"-5%", bg:"radial-gradient(circle,#B45A22 0%,transparent 70%)",anim:"float5 11s ease-in-out infinite" },
    { w:800, h:800, top:"5%",  left:"35%",   bg:"radial-gradient(circle,#d4c9b0 0%,transparent 70%)",anim:"float6 8.5s ease-in-out infinite" },
  ];

  return (
    <div style={{ position:"fixed",inset:0,overflow:"hidden",zIndex:0 }}>
      <div style={{ position:"absolute",inset:0,background:"#EDDABB" }} />
      {orbs.map((o,i) => (
        <div key={i} ref={el=>orbRefs.current[i]=el}
          style={{ position:"absolute",borderRadius:"50%",width:o.w,height:o.h,top:o.top,left:o.left,right:o.right,bottom:o.bottom,background:o.bg,animation:o.anim }}>
          <div style={{ width:"100%",height:"100%",borderRadius:"50%",filter:"blur(110px)",mixBlendMode:"multiply",opacity:0.7 }} />
        </div>
      ))}
      <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(100,70,30,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(100,70,30,0.04) 1px,transparent 1px)",backgroundSize:"60px 60px" }} />
      <div style={{ position:"absolute",inset:"-50%",width:"200%",height:"200%",opacity:0.06,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize:"256px 256px",animation:"grain 0.4s steps(1) infinite" }} />
      <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(150,100,40,0.2) 100%)" }} />
    </div>
  );
}

function PawSVG({ style }) {
  return (
    <svg style={style} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="66" rx="24" ry="21"/>
      <ellipse cx="25" cy="43" rx="11" ry="14" transform="rotate(-14 25 43)"/>
      <ellipse cx="43" cy="33" rx="11" ry="14" transform="rotate(-5 43 33)"/>
      <ellipse cx="62" cy="33" rx="11" ry="14" transform="rotate(5 62 33)"/>
      <ellipse cx="78" cy="43" rx="10" ry="13" transform="rotate(14 78 43)"/>
    </svg>
  );
}

function DogCursor() {
  const cursorRef = useRef(null);
  const s = useRef({ mouseX:0,mouseY:0,dogX:0,dogY:0,isClicking:false });
  useEffect(() => {
    s.current.dogX = window.innerWidth/2; s.current.dogY = window.innerHeight/2;
    const onMove = (e) => { s.current.mouseX=e.clientX; s.current.mouseY=e.clientY; };
    const onDown = () => {
      s.current.isClicking=true;
      if (cursorRef.current) cursorRef.current.className="dog-cursor clicking";
      setTimeout(()=>{ s.current.isClicking=false; },300);
    };
    document.addEventListener("mousemove",onMove);
    document.addEventListener("mousedown",onDown);
    let raf;
    const loop = () => {
      const el=cursorRef.current; if (!el){ raf=requestAnimationFrame(loop); return; }
      if (!s.current.isClicking) {
        const dx=s.current.mouseX-s.current.dogX, dy=s.current.mouseY-s.current.dogY;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if (dist>5) {
          s.current.dogX+=(dx/dist)*Math.min(dist*0.13,18);
          s.current.dogY+=(dy/dist)*Math.min(dist*0.13,18);
          const svg=document.getElementById("dog-svg-r");
          if (svg) svg.style.transform=dx>0?"scaleX(1)":"scaleX(-1)";
          el.className="dog-cursor "+(dist>7?"walking":"idle");
        } else { el.className="dog-cursor idle"; }
      }
      el.style.left=s.current.dogX+"px"; el.style.top=s.current.dogY+"px";
      raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);
    return () => { document.removeEventListener("mousemove",onMove); document.removeEventListener("mousedown",onDown); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div ref={cursorRef} className="dog-cursor idle"
      style={{ position:"fixed",zIndex:99999,pointerEvents:"none",width:28,height:28,transform:"translate(-50%,-50%)" }}>
      <svg id="dog-svg-r" width="54" height="54" viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg" style={{ overflow:"visible" }}>
        <ellipse cx="27" cy="50" rx="14" ry="3" fill="rgba(0,0,0,0.13)" />
        <g id="dog-tail"><path d="M10 22 Q2 14 6 8 Q10 4 12 10 Q10 16 14 20Z" fill="#c8a06a" stroke="#7a5530" strokeWidth="1.2" strokeLinejoin="round"/></g>
        <g id="dog-body">
          <g id="dog-leg-back"><rect x="11" y="30" width="6" height="14" rx="3" fill="#b8904a" stroke="#7a5530" strokeWidth="1"/><ellipse cx="14" cy="44" rx="5" ry="3" fill="#a07838" stroke="#7a5530" strokeWidth="1"/></g>
          <rect x="10" y="16" width="28" height="18" rx="9" fill="#d4a96a" stroke="#7a5530" strokeWidth="1.5"/>
          <g id="dog-leg-front"><rect x="27" y="30" width="6" height="14" rx="3" fill="#c8a06a" stroke="#7a5530" strokeWidth="1"/><ellipse cx="30" cy="44" rx="5" ry="3" fill="#a07838" stroke="#7a5530" strokeWidth="1"/></g>
          <ellipse cx="38" cy="10" rx="10" ry="9" fill="#d4a96a" stroke="#7a5530" strokeWidth="1.5"/>
          <circle cx="42" cy="8" r="2.2" fill="#2a1a08"/>
          <g id="dog-ear"><path d="M36 4 Q40 0 44 3 Q42 8 38 9Z" fill="#b87840" stroke="#7a5530" strokeWidth="1" strokeLinejoin="round"/></g>
        </g>
      </svg>
    </div>
  );
}

function TermsModal({ onAccept, onDecline, onClose }) {
  return (
    <div onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}
      style={{ position:"fixed",inset:0,zIndex:10000,background:"rgba(20,35,15,0.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem",animation:"modalFadeIn .22s ease" }}>
      <div style={{ background:"#fff",borderRadius:20,width:"100%",maxWidth:600,maxHeight:"88vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(60,100,30,0.18)",animation:"modalSlideUp .26s cubic-bezier(.34,1.3,.64,1)",overflow:"hidden" }}>
        <div style={{ display:"flex",alignItems:"center",gap:"0.9rem",padding:"1.4rem 1.6rem 1.2rem",borderBottom:"1.5px solid #e8f0e2",background:"linear-gradient(135deg,#f4faf0,#edf7e5)",flexShrink:0 }}>
          <div style={{ width:48,height:48,background:"#fff",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(90,138,48,0.15)",flexShrink:0 }}>
            <svg width="28" height="28" viewBox="0 0 100 100" fill="#5a8a30">
              <ellipse cx="50" cy="66" rx="24" ry="21"/>
              <ellipse cx="25" cy="43" rx="11" ry="14" transform="rotate(-14 25 43)"/>
              <ellipse cx="43" cy="33" rx="11" ry="14" transform="rotate(-5 43 33)"/>
              <ellipse cx="62" cy="33" rx="11" ry="14" transform="rotate(5 62 33)"/>
              <ellipse cx="78" cy="43" rx="10" ry="13" transform="rotate(14 78 43)"/>
            </svg>
          </div>
          <div>
            <h2 style={{ fontFamily:"'Nunito',sans-serif",fontSize:"1.05rem",fontWeight:800,color:"#2a4a18",margin:"0 0 0.15rem" }}>Terms of Service &amp; Privacy Policy</h2>
            <p style={{ fontFamily:"'Nunito',sans-serif",fontSize:"0.78rem",color:"#7aaa50",margin:0,fontWeight:600 }}>Pawster — Last updated March 2026</p>
          </div>
          <button onClick={onClose} style={{ marginLeft:"auto",background:"none",border:"none",fontSize:"1.6rem",color:"#6a8a58",padding:"0.2rem 0.4rem",borderRadius:8 }}>&times;</button>
        </div>
        <div style={{ overflowY:"auto",padding:"1.4rem 1.6rem",flex:1 }}>
          {[
            ["1. Acceptance of Terms","By creating an account on Pawster, you agree to these Terms and our Privacy Policy."],
            ["2. Purpose","Pawster connects adopters with rescue organizations. We are not responsible for individual shelter or adopter actions."],
            ["3. Eligibility","You must be at least 18 years of age to register."],
            ["4. Identity Verification","Your government-issued ID is stored securely and only accessible to authorized Pawster staff."],
            ["5. User Responsibilities","You agree to provide accurate information and are responsible for your account security."],
            ["6. Privacy & Data Use","We do not sell your data. We collect name, email, phone for account management; address to match you with nearby animals; and government ID for identity verification only."],
            ["7. Prohibited Conduct","You may not use Pawster for unlawful purposes, to harm animals or users, or to submit false information."],
            ["8. Termination","We may suspend accounts that violate these Terms or pose a risk to animal welfare."],
            ["9. Limitation of Liability","Pawster is provided \"as is.\" We are not liable for damages from platform use."],
            ["10. Contact","Questions? Email support@pawster.com"],
          ].map(([title, text]) => (
            <div key={title} style={{ marginBottom:"1.3rem" }}>
              <h3 style={{ fontFamily:"'Nunito',sans-serif",fontSize:"0.88rem",fontWeight:800,color:"#3a6a20",margin:"0 0 0.45rem",textTransform:"uppercase",letterSpacing:"0.04em" }}>{title}</h3>
              <p style={{ fontFamily:"'Nunito',sans-serif",fontSize:"0.88rem",color:"#4a5a42",lineHeight:1.65 }}>{text}</p>
            </div>
          ))}
        </div>
        <div style={{ display:"flex",gap:"0.75rem",padding:"1.1rem 1.6rem 1.3rem",borderTop:"1.5px solid #e8f0e2",background:"#fafdf8",flexShrink:0 }}>
          <button onClick={onDecline} style={{ flex:1,padding:"0.7rem 1rem",border:"2px solid #c8ddb8",background:"#fff",color:"#5a7a48",fontFamily:"'Nunito',sans-serif",fontSize:"0.9rem",fontWeight:700,borderRadius:10 }}>Decline</button>
          <button onClick={onAccept}  style={{ flex:2,padding:"0.7rem 1rem",border:"none",background:"linear-gradient(135deg,#6aaa38,#4a8a20)",color:"#fff",fontFamily:"'Nunito',sans-serif",fontSize:"0.9rem",fontWeight:800,borderRadius:10,boxShadow:"0 4px 14px rgba(90,138,48,0.3)" }}>I Accept &amp; Create Account</button>
        </div>
      </div>
    </div>
  );
}

function getPasswordStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8)          score++;
  if (pw.length >= 12)         score++;
  if (/[A-Z]/.test(pw))       score++;
  if (/[a-z]/.test(pw))       score++;
  if (/[0-9]/.test(pw))       score++;
  if (/[!@#$%^&*]/.test(pw))  score++;
  if (score <= 2) return { label:"Weak",   color:"#d04040", bars:1, tip:"Try adding numbers or symbols" };
  if (score <= 3) return { label:"Fair",   color:"#e07820", bars:2, tip:"Add uppercase & special characters" };
  if (score <= 4) return { label:"Good",   color:"#c8a020", bars:3, tip:"Almost there — try a longer password" };
  return           { label:"Strong", color:"#3a9020", bars:4, tip:null };
}

function PasswordStrengthMeter({ password }) {
  const s = getPasswordStrength(password);
  if (!s) return null;
  return (
    <div style={{ marginTop:"-0.4rem", marginBottom:"0.9rem" }}>
      <div style={{ display:"flex", gap:4, marginBottom:"0.3rem" }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex:1, height:5, borderRadius:3, background: i <= s.bars ? s.color : "rgba(180,150,80,0.22)", transition:"background 0.25s" }}/>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:"0.72rem", fontWeight:800, color:s.color, letterSpacing:"0.04em" }}>{s.label} password</span>
        {s.tip && <span style={{ fontSize:"0.70rem", fontWeight:700, color:"#8a7a50" }}>{s.tip}</span>}
      </div>
    </div>
  );
}

function Field({ label, id, type="text", placeholder, value, onChange, error, style }) {
  return (
    <div style={{ marginBottom:"0.95rem", display:"flex", flexDirection:"column", ...style }}>
      <label htmlFor={id} style={{ fontSize:"0.72rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.07em", color: error ? "#c03030" : "#276010", marginBottom:"0.38rem", fontStyle:"italic" }}>
        {label}
      </label>
      <div style={{ position:"relative" }}>
        <input id={id} type={type} placeholder={placeholder} value={value} onChange={onChange} className="field-input"
          style={{ display:"block", width:"100%", padding:"0.75rem 0.9rem", border:`2px solid ${error ? "#d04040" : "#5aaa30"}`, borderLeft: error ? "4px solid #d04040" : "2px solid #5aaa30", borderRadius:10, background: error ? "rgba(253,240,240,0.60)" : "rgba(255,250,232,0.52)", fontFamily:"'Nunito',sans-serif", fontSize:"0.9rem", fontWeight:600, color:"#222", outline:"none", transition:"border-color 0.18s,box-shadow 0.18s,background 0.18s" }}
        />
      </div>
      {error && (
        <span style={{ display:"flex",alignItems:"center",gap:"0.3rem",fontSize:"0.72rem",fontWeight:700,color:"#c03030",marginTop:"0.28rem" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </span>
      )}
    </div>
  );
}

function MapPickerModal({ onClose, onConfirm }) {
  const mapRef     = useRef(null);
  const leafletMap = useRef(null);
  const markerRef  = useRef(null);
  const [picked, setPicked]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [geoErr, setGeoErr]   = useState("");

  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css"; link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }
    const initMap = () => {
      if (leafletMap.current || !mapRef.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, { zoomControl: true }).setView([14.5995, 120.9842], 12);
      leafletMap.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 19 }).addTo(map);
      const pawIcon = L.divIcon({
        className: "",
        html: `<div style="width:40px;height:40px;background:linear-gradient(135deg,#1c4f09,#2a6e10);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 12px rgba(28,79,9,0.45);display:flex;align-items:center;justify-content:center;">
          <svg style="transform:rotate(45deg)" width="20" height="20" viewBox="0 0 100 100" fill="white" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="66" rx="24" ry="21"/><ellipse cx="25" cy="43" rx="11" ry="14" transform="rotate(-14 25 43)"/>
            <ellipse cx="43" cy="33" rx="11" ry="14" transform="rotate(-5 43 33)"/><ellipse cx="62" cy="33" rx="11" ry="14" transform="rotate(5 62 33)"/>
            <ellipse cx="78" cy="43" rx="10" ry="13" transform="rotate(14 78 43)"/>
          </svg></div>`,
        iconSize: [40, 40], iconAnchor: [20, 40],
      });
      const placeMarker = (lat, lng) => {
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        else markerRef.current = L.marker([lat, lng], { icon: pawIcon }).addTo(map);
        setLoading(true); setGeoErr("");
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          .then(r => r.json())
          .then(data => {
            const a = data.address || {};
            const road    = a.road || a.pedestrian || a.footway || "";
            const houseNo = a.house_number || "";
            const suburb  = a.suburb || a.village || a.neighbourhood || "";
            const city    = a.city || a.town || a.municipality || "";
            const province= a.province || a.state || "";
            const postcode= a.postcode || "";
            const streetLine = [houseNo, road, suburb].filter(Boolean).join(" ");
            // Also do PHL_ZIP_DB lookup to cross-check postcode
            const dbMatches = lookupZip(city);
            const verifiedZip = postcode || (dbMatches.length > 0 ? String(dbMatches[0][3]) : "");
            setPicked({ lat, lng, street: streetLine, city, province, zip: verifiedZip, label: data.display_name });
          })
          .catch(() => setGeoErr("Could not fetch address. You can still confirm."))
          .finally(() => setLoading(false));
      };
      map.on("click", e => placeMarker(e.latlng.lat, e.latlng.lng));
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => { map.setView([pos.coords.latitude, pos.coords.longitude], 15); placeMarker(pos.coords.latitude, pos.coords.longitude); },
          () => {}
        );
      }
    };
    if (window.L) { initMap(); }
    else if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js"; script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.onload = initMap; document.head.appendChild(script);
    } else {
      const interval = setInterval(() => { if (window.L) { clearInterval(interval); initMap(); } }, 100);
      return () => clearInterval(interval);
    }
    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; } };
  }, []);

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:"fixed",inset:0,zIndex:20000,background:"rgba(10,25,5,0.65)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",animation:"modalFadeIn .22s ease" }}>
      <div style={{ width:"100%",maxWidth:680,background:"rgba(255,250,230,0.97)",borderRadius:24,overflow:"hidden",boxShadow:"0 28px 72px rgba(28,79,9,0.22)",display:"flex",flexDirection:"column",maxHeight:"90vh",animation:"modalSlideUp .28s cubic-bezier(.34,1.3,.64,1)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:"0.8rem",padding:"1.1rem 1.4rem",background:"linear-gradient(135deg,#1c4f09,#2a6e10)",flexShrink:0 }}>
          <div style={{ width:38,height:38,background:"rgba(255,255,255,0.15)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 1 8 8c0 5.25-8 13-8 13S4 15.25 4 10a8 8 0 0 1 8-8z"/></svg>
          </div>
          <div>
            <h3 style={{ fontFamily:"'Nunito',sans-serif",fontSize:"1rem",fontWeight:900,color:"#fff",margin:0 }}>Pin Your Address</h3>
            <p style={{ fontFamily:"'Nunito',sans-serif",fontSize:"0.74rem",fontWeight:700,color:"rgba(255,255,255,0.75)",margin:0 }}>Click anywhere on the map to set your location</p>
          </div>
          <button onClick={onClose} style={{ marginLeft:"auto",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",width:32,height:32,borderRadius:8,fontSize:"1.2rem",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>
        <div style={{ position:"relative",flex:"1 1 380px",minHeight:340 }}>
          <div ref={mapRef} style={{ width:"100%",height:"100%",minHeight:340 }} />
          {!picked && !loading && (
            <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"rgba(28,79,9,0.88)",color:"#fff",padding:"0.6rem 1.1rem",borderRadius:30,fontFamily:"'Nunito',sans-serif",fontSize:"0.82rem",fontWeight:800,pointerEvents:"none",whiteSpace:"nowrap",boxShadow:"0 4px 16px rgba(0,0,0,0.2)" }}>
              📍 Click on the map to drop a pin
            </div>
          )}
          {loading && (
            <div style={{ position:"absolute",bottom:12,left:"50%",transform:"translateX(-50%)",background:"rgba(28,79,9,0.9)",color:"#fff",padding:"0.45rem 1rem",borderRadius:20,fontFamily:"'Nunito',sans-serif",fontSize:"0.78rem",fontWeight:800,display:"flex",alignItems:"center",gap:"0.4rem" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation:"spin 0.8s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              Fetching address…
            </div>
          )}
        </div>
        {(picked || geoErr) && (
          <div style={{ padding:"0.9rem 1.4rem",background:"rgba(240,252,232,0.85)",borderTop:"1.5px solid rgba(90,170,48,0.25)",flexShrink:0 }}>
            {geoErr && <p style={{ fontFamily:"'Nunito',sans-serif",fontSize:"0.78rem",fontWeight:700,color:"#c03030",margin:"0 0 0.5rem" }}>⚠ {geoErr}</p>}
            {picked && (
              <div style={{ display:"flex",alignItems:"flex-start",gap:"0.6rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2a7010" strokeWidth="2.2" style={{ flexShrink:0,marginTop:2 }} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 1 8 8c0 5.25-8 13-8 13S4 15.25 4 10a8 8 0 0 1 8-8z"/></svg>
                <p style={{ fontFamily:"'Nunito',sans-serif",fontSize:"0.82rem",fontWeight:700,color:"#2a5010",lineHeight:1.5,margin:0 }}>{picked.label}</p>
              </div>
            )}
          </div>
        )}
        <div style={{ display:"flex",gap:"0.7rem",padding:"0.9rem 1.4rem",borderTop:"1.5px solid rgba(180,150,80,0.22)",background:"rgba(255,250,228,0.9)",flexShrink:0 }}>
          <button onClick={onClose} style={{ flex:1,padding:"0.7rem",border:"2px solid rgba(28,79,9,0.3)",background:"transparent",color:"#1c4f09",fontFamily:"'Nunito',sans-serif",fontSize:"0.9rem",fontWeight:800,borderRadius:10 }}>Cancel</button>
          <button onClick={() => picked && onConfirm(picked)} disabled={!picked || loading}
            style={{ flex:2,padding:"0.7rem",border:"none",background:picked?"linear-gradient(135deg,#1c4f09,#2a6e10)":"rgba(180,180,160,0.4)",color:picked?"#fff":"#aaa",fontFamily:"'Nunito',sans-serif",fontSize:"0.9rem",fontWeight:800,borderRadius:10,boxShadow:picked?"0 4px 14px rgba(28,79,9,0.28)":"none",transition:"all 0.2s" }}>
            {picked ? "✓ Use This Location" : "Drop a pin first"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stepper({ current }) {
  const steps = ["Personal Info","Location","Verification"];
  return (
    <div style={{ display:"flex",alignItems:"center",marginBottom:"1.5rem" }}>
      {steps.map((label,i) => {
        const n = i+1, done = n < current, active = n === current;
        return (
          <div key={n} style={{ display:"contents" }}>
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:"0.3rem",minWidth:0 }}>
              <div style={{ width:36,height:36,borderRadius:"50%",border:`2.5px solid ${done||active?"#1c4f09":"rgba(180,150,80,0.35)"}`,background:done?"#1c4f09":active?"rgba(28,79,9,0.10)":"rgba(255,248,225,0.60)",color:done?"#fff":active?"#1c4f09":"#a09060",fontSize:done?0:"0.88rem",fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.3s",boxShadow:active?"0 0 0 4px rgba(28,79,9,0.12)":"none" }}>
                {done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : n}
              </div>
              <span style={{ fontSize:"0.67rem",fontWeight:800,color:active?"#1c4f09":done?"#4a7a28":"#a09060",textAlign:"center",whiteSpace:"nowrap",letterSpacing:"0.02em" }}>{label}</span>
            </div>
            {i < 2 && <div style={{ flex:1,height:2,margin:"0 6px",marginBottom:18,background:done?"#1c4f09":"rgba(180,150,80,0.28)",borderRadius:2,transition:"background 0.3s",minWidth:20 }}/>}
          </div>
        );
      })}
    </div>
  );
}

// ── Smart Zip Field Component ───────────────────────────────────────────────
function ZipField({ city, value, onChange, onSelect, error }) {
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow]               = useState(false);
  const wrapRef = useRef(null);

  // Auto-suggest when city changes
  useEffect(() => {
    if (city && city.trim().length >= 2) {
      const matches = lookupZip(city);
      if (matches.length === 1) {
        // Auto-select unique match
        onSelect(matches[0]);
        setSuggestions([]);
        setShow(false);
      } else if (matches.length > 1) {
        setSuggestions(matches.slice(0, 10));
        setShow(true);
      } else {
        setSuggestions([]);
        setShow(false);
      }
    }
  }, [city]);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShow(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (e) => {
    onChange(e);
    const q = e.target.value;
    if (q.length >= 2) {
      const matches = lookupZip(q);
      setSuggestions(matches.slice(0, 10));
      setShow(matches.length > 0);
    } else {
      setSuggestions([]); setShow(false);
    }
  };

  return (
    <div style={{ marginBottom:"0.95rem", display:"flex", flexDirection:"column" }}>
      <label htmlFor="zip" style={{ fontSize:"0.72rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.07em", color: error ? "#c03030" : "#276010", marginBottom:"0.38rem", fontStyle:"italic" }}>
        Zip / Postal Code
      </label>
      <div style={{ position:"relative" }} ref={wrapRef}>
        <input
          id="zip" type="text" placeholder="Auto-fills from city, or search here…"
          value={value} onChange={handleInput} onFocus={() => {
            const matches = lookupZip(city || value);
            if (matches.length) { setSuggestions(matches.slice(0,10)); setShow(true); }
          }}
          className="field-input"
          style={{ display:"block", width:"100%", padding:"0.75rem 0.9rem", border:`2px solid ${error ? "#d04040" : "#5aaa30"}`, borderLeft: error ? "4px solid #d04040" : "2px solid #5aaa30", borderRadius:10, background: error ? "rgba(253,240,240,0.60)" : "rgba(255,250,232,0.52)", fontFamily:"'Nunito',sans-serif", fontSize:"0.9rem", fontWeight:600, color:"#222", outline:"none", transition:"border-color 0.18s,box-shadow 0.18s" }}
          autoComplete="off"
        />
        {show && suggestions.length > 0 && (
          <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:9999, background:"rgba(255,252,238,0.99)", border:"2px solid #5aaa30", borderRadius:10, boxShadow:"0 8px 28px rgba(28,79,9,0.18)", maxHeight:220, overflowY:"auto" }}>
            {suggestions.map((r, i) => (
              <div key={i}
                onMouseDown={(e) => { e.preventDefault(); onSelect(r); setShow(false); setSuggestions([]); }}
                style={{ padding:"0.6rem 0.9rem", cursor:"pointer", borderBottom: i < suggestions.length-1 ? "1px solid rgba(90,170,48,0.15)" : "none", fontFamily:"'Nunito',sans-serif", fontSize:"0.84rem", display:"flex", alignItems:"center", gap:"0.6rem" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(90,170,48,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}
              >
                <span style={{ fontWeight:900, color:"#1c4f09", minWidth:42, fontSize:"0.88rem" }}>{r[3]}</span>
                <span style={{ fontWeight:700, color:"#2a4a18", flex:1 }}>{r[2]}</span>
                <span style={{ fontWeight:600, color:"#7a9060", fontSize:"0.74rem", textAlign:"right" }}>{r[1]}</span>
              </div>
            ))}
            <div style={{ padding:"0.4rem 0.9rem", fontSize:"0.70rem", fontWeight:700, color:"#7a9060", borderTop:"1px solid rgba(90,170,48,0.15)", background:"rgba(240,252,232,0.6)" }}>
              PHLPost official data · select the zone for your barangay
            </div>
          </div>
        )}
      </div>
      {error && (
        <span style={{ display:"flex",alignItems:"center",gap:"0.3rem",fontSize:"0.72rem",fontWeight:700,color:"#c03030",marginTop:"0.28rem" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </span>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const { register }              = useAuth();
  const [step, setStep]           = useState(1);
  const [showTerms, setShowTerms] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [alert, setAlert]         = useState({ type:"",msg:"" });
  const [loading, setLoading]     = useState(false);
  const [form, setForm]           = useState({
    firstName:"", lastName:"", email:"", phone:"", password:"", confirmPassword:"",
    address:"", city:"", province:"", zip:"",
  });
  const [idFile, setIdFile]           = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors]           = useState({});
  const [uploadLabel, setUploadLabel] = useState("No file selected");
  const [showMap, setShowMap]         = useState(false);

  const set = (k) => (e) => {
    setForm(f=>({...f,[k]:e.target.value}));
    setErrors(v=>({...v,[k]:""}));
    setAlert({type:"",msg:""});
  };

  // Called when user picks a zip suggestion from the dropdown
  const handleZipSelect = (r) => {
    setForm(f => ({
      ...f,
      zip:      String(r[3]),
      city:     r[2],
      province: `${r[1]}`,
    }));
    setErrors(v => ({...v, zip:"", city:"", province:""}));
  };

  function validateStep1() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.lastName.trim())  e.lastName  = "Last name is required.";
    if (!form.email.trim())     e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.phone.trim())     e.phone = "Phone number is required.";
    else if (!/^(09\d{9}|\+639\d{9})$/.test(form.phone.trim())) e.phone = "Enter a valid PH number (e.g. 09171234567 or +639171234567).";
    if (!form.password)         e.password = "Password is required.";
    if (!form.confirmPassword)  e.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e = {};
    if (!form.address.trim())  e.address  = "Street address is required.";
    if (!form.city.trim())     e.city     = "City is required.";
    if (!form.province.trim()) e.province = "Province is required.";
    if (!form.zip.trim())      e.zip      = "Zip / Postal code is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goTo(next) {
    setAlert({type:"",msg:""});
    if (next > step) {
      if (step===1 && !validateStep1()) return;
      if (step===2 && !validateStep2()) return;
    }
    setStep(next);
  }

  async function doRegister() {
    setLoading(true);
    const fd = new FormData();
    fd.append("firstName", form.firstName.trim());
    fd.append("lastName",  form.lastName.trim());
    fd.append("email",     form.email.trim());
    fd.append("phone",     form.phone.trim());
    fd.append("password",  form.password);
    fd.append("address",   form.address.trim());
    fd.append("city",      form.city.trim());
    fd.append("province",  form.province.trim());
    fd.append("zip",       form.zip.trim());
    fd.append("idFile",    idFile);
    try {
      await register(fd);
    } catch (err) {
      const msg = err.response?.data?.message || "An error occurred during registration.";
      setAlert({ type:"error", msg });
      setLoading(false);
    }
  }

  function handleSubmit() {
    setAlert({ type:"", msg:"" });
    if (!idFile) { setUploadLabel("⚠ Please upload a government-issued ID."); return; }
    setPendingSubmit(true);
    setShowTerms(true);
  }

  async function handleTermsAccept() {
    setTermsAccepted(true);
    setShowTerms(false);
    setPendingSubmit(false);
    await doRegister();
  }

  function handleTermsDecline() {
    setTermsAccepted(false);
    setPendingSubmit(false);
    setShowTerms(false);
  }

  function handleMapConfirm(loc) {
    setForm(f => ({
      ...f,
      address:  loc.street   || f.address,
      city:     loc.city     || f.city,
      province: loc.province || f.province,
      zip:      loc.zip      || f.zip,
    }));
    setErrors(v => ({ ...v, address:"", city:"", province:"", zip:"" }));
    setShowMap(false);
  }

  const pawData = [
    { top:"18%",left:"2%",  width:120,fill:"rgba(72,95,42,0.28)",  rotate:-8  },
    { top:"48%",left:"5%",  width:85, fill:"rgba(72,95,42,0.22)",  rotate:6   },
    { bottom:"-2%",left:"-2%",width:210,fill:"rgba(195,130,70,0.18)",rotate:-18 },
    { top:"41%",left:"52%", width:55, fill:"rgba(195,135,75,0.55)", rotate:-14 },
    { bottom:"18%",left:"46%",width:160,fill:"rgba(198,138,80,0.62)",rotate:13 },
    { top:"24%",left:"38%", width:60, fill:"rgba(72,95,42,0.17)",  rotate:-5  },
  ];

  const btnBase = { fontFamily:"'Nunito',sans-serif",fontWeight:900,fontSize:"1rem",border:"none",borderRadius:12,padding:"0.88rem",cursor:"pointer",transition:"background 0.18s,transform 0.15s,box-shadow 0.15s" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0;padding:0;box-sizing:border-box;cursor:none!important; }
        html,body{height:100%;font-family:'Nunito',sans-serif;overflow:hidden;background:#EDDABB;}
        @keyframes float1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(12%,16%) scale(1.15)}66%{transform:translate(-8%,8%) scale(0.9)}}
        @keyframes float2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-14%,10%) scale(0.9)}66%{transform:translate(8%,-15%) scale(1.15)}}
        @keyframes float3{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(14%,-10%) scale(1.12)}75%{transform:translate(-10%,8%) scale(0.9)}}
        @keyframes float4{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-15%,-12%) scale(1.18)}}
        @keyframes float5{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(-10%,-18%) scale(1.1)}80%{transform:translate(8%,-8%) scale(0.9)}}
        @keyframes float6{0%,100%{transform:translate(0,0) scale(1)}30%{transform:translate(15%,12%) scale(1.15)}70%{transform:translate(-8%,18%) scale(0.88)}}
        @keyframes grain{0%,100%{transform:translate(0,0)}50%{transform:translate(-2%,2%)}}
        @keyframes legFrontWalk{0%,100%{transform-origin:30px 28px;transform:rotate(-22deg)}50%{transform-origin:30px 28px;transform:rotate(22deg)}}
        @keyframes legBackWalk{0%,100%{transform-origin:14px 28px;transform:rotate(22deg)}50%{transform-origin:14px 28px;transform:rotate(-22deg)}}
        @keyframes tailWag{0%,100%{transform-origin:8px 18px;transform:rotate(-18deg)}50%{transform-origin:8px 18px;transform:rotate(18deg)}}
        @keyframes bodyBob{0%,100%{transform:translateY(0px)}50%{transform:translateY(-1.5px)}}
        @keyframes earFlop{0%,100%{transform-origin:36px 10px;transform:rotate(0deg)}50%{transform-origin:36px 10px;transform:rotate(8deg)}}
        @keyframes sitSettle{0%{transform:translateY(0px)}40%{transform:translateY(-3px)}100%{transform:translateY(0px)}}
        @keyframes pawTap{0%,100%{transform-origin:30px 28px;transform:rotate(0deg)}50%{transform-origin:30px 28px;transform:rotate(-30deg)}}
        @keyframes modalFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes modalSlideUp{from{transform:translateY(28px) scale(.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
        @keyframes cardIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes stepFadeIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .dog-cursor.walking #dog-body{animation:bodyBob .28s ease-in-out infinite}
        .dog-cursor.walking #dog-leg-front{animation:legFrontWalk .28s ease-in-out infinite}
        .dog-cursor.walking #dog-leg-back{animation:legBackWalk .28s ease-in-out infinite}
        .dog-cursor.walking #dog-tail{animation:tailWag .28s ease-in-out infinite}
        .dog-cursor.walking #dog-ear{animation:earFlop .32s ease-in-out infinite}
        .dog-cursor.idle #dog-tail{animation:tailWag .6s ease-in-out infinite}
        .dog-cursor.clicking #dog-body{animation:sitSettle .2s ease-out forwards}
        .dog-cursor.clicking #dog-leg-front{animation:pawTap .18s ease-in-out 2}
        .field-input:focus{border-color:#1c4f09!important;border-left-color:#1c4f09!important;background:rgba(255,252,238,0.78)!important;box-shadow:0 0 0 3px rgba(28,79,9,0.09)!important}
        .field-input::placeholder{color:#b0a07a;font-style:italic;font-weight:600;}
        .upload-btn:hover{background:rgba(236,221,184,0.8)!important;border-style:solid!important;}
        .btn-primary:hover:not(:disabled){background:linear-gradient(135deg,#143806,#1e5c0a)!important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(28,79,9,0.32)!important}
        .btn-primary:active:not(:disabled){transform:translateY(0)!important}
        .btn-outline:hover{background:rgba(28,79,9,0.06)!important;transform:translateY(-1px);}
        .step-content{animation:stepFadeIn 0.22s ease both}
      `}</style>

      <MeshBackground />
      <DogCursor />

      {showTerms && <TermsModal onAccept={handleTermsAccept} onDecline={handleTermsDecline} onClose={handleTermsDecline} />}
      {showMap   && <MapPickerModal onClose={() => setShowMap(false)} onConfirm={handleMapConfirm} />}

      <nav style={{ position:"fixed",top:0,right:0,zIndex:300,display:"flex",alignItems:"center",gap:"0.9rem",padding:"0.85rem 1.6rem" }}>
        <button onClick={()=>window.location.href="/login"}
          style={{ background:"#1c4f09",color:"#fff",border:"none",borderRadius:50,fontFamily:"'Nunito',sans-serif",fontSize:"0.95rem",fontWeight:800,padding:"0.45rem 1.5rem" }}>
          Sign in
        </button>
        <span style={{ fontFamily:"'Nunito',sans-serif",fontSize:"0.95rem",fontWeight:800,color:"#1c4f09",borderBottom:"2.5px solid #1c4f09",padding:"0.15rem 0.3rem 0.2rem" }}>Register</span>
        <a href="/"><img src={logo} alt="Pawster Logo" style={{ width:64,height:64,objectFit:"cover" }}/></a>
      </nav>

      <div style={{ position:"relative",zIndex:10,display:"flex",alignItems:"center",height:"100vh",width:"100vw",maxWidth:1920,maxHeight:1200,margin:"0 auto",padding:"0 6vw",gap:"2vw" }}>

        {/* Left Panel */}
        <div style={{ flex:1,position:"relative",height:"100vh",maxHeight:1200,overflow:"visible" }}>
          <div style={{ position:"absolute",inset:0,zIndex:5,pointerEvents:"none" }}>
            {pawData.map((p,i)=>(
              <PawSVG key={i} style={{ position:"absolute",top:p.top,left:p.left,bottom:p.bottom,width:p.width,height:p.width,fill:p.fill,transform:`rotate(${p.rotate}deg)` }}/>
            ))}
          </div>
          <img src={Dogs} alt="Pawster Dog Mascot"
            style={{ position:"absolute",bottom:0,left:"-1%",zIndex:10,height:"82vh",maxHeight:760,width:"auto",objectFit:"contain",filter:"drop-shadow(0 10px 28px rgba(0,0,0,0.16))" }}/>
          <div style={{ position:"absolute",top:"4%",left:"15%",zIndex:20,textAlign:"center",maxWidth:560 }}>
            <h1 style={{ fontSize:"clamp(3rem,3.8vw,4.8rem)",fontWeight:900,color:"#1a4a08",lineHeight:0.95,textTransform:"uppercase",letterSpacing:-1,textShadow:"0 2px 14px rgba(255,255,255,0.22)" }}>
              Welcome to<br/>Pawster!
            </h1>
            <p style={{ marginTop:"1rem",fontSize:"clamp(0.88rem,1vw,1.05rem)",fontWeight:700,color:"#2a5010",lineHeight:1.62,maxWidth:420,marginLeft:"auto",marginRight:"auto",textShadow:"0 1px 6px rgba(255,255,255,0.32)" }}>
              Join our community and start making a difference in rescued animals' lives.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ width:500,minWidth:460,flexShrink:0,alignSelf:"center",marginRight:"3vw",marginTop:"3vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"2rem 2.4rem",background:"rgba(255,248,225,0.42)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1.5px solid rgba(255,238,190,0.55)",borderRadius:28,boxShadow:"0 12px 48px rgba(160,105,30,0.15),0 2px 12px rgba(0,0,0,0.07)",overflowY:"auto",maxHeight:"92vh",animation:"cardIn 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>

          <div style={{ textAlign:"center",marginBottom:"1.4rem" }}>
            <h2 style={{ fontSize:"clamp(1.7rem,2.2vw,2.4rem)",fontWeight:900,color:"#1a4a08",lineHeight:1.05,marginBottom:"0.35rem" }}>Create Your Account</h2>
            <p style={{ fontSize:"0.84rem",fontWeight:600,color:"#5a7a40",lineHeight:1.5 }}>Join our community and start making a difference</p>
          </div>

          <Stepper current={step} />

          {alert.msg && (
            <div style={{ borderRadius:10,padding:"0.7rem 0.9rem",fontSize:"0.84rem",fontWeight:700,marginBottom:"0.9rem",display:"flex",alignItems:"center",gap:"0.5rem",background:alert.type==="success"?"rgba(230,245,220,0.9)":"rgba(253,232,232,0.9)",color:alert.type==="success"?"#276010":"#b83030",border:alert.type==="success"?"1px solid #90d060":"1px solid #f0a0a0",borderLeft:alert.type==="success"?"4px solid #5aaa30":"4px solid #d04040" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {alert.msg}
            </div>
          )}

          {/* ── Step 1 ── */}
          {step===1 && (
            <div className="step-content">
              <div style={{ display:"flex",gap:"0.9rem" }}>
                <Field label="First name" id="firstName" placeholder="First name…" value={form.firstName} onChange={set("firstName")} error={errors.firstName} style={{ flex:1 }}/>
                <Field label="Last name"  id="lastName"  placeholder="Last name…"  value={form.lastName}  onChange={set("lastName")}  error={errors.lastName}  style={{ flex:1 }}/>
              </div>
              <Field label="Email"        id="email"    type="email"    placeholder="your@email.com"               value={form.email}    onChange={set("email")}    error={errors.email}/>
              <Field label="Phone Number" id="phone"    type="tel"      placeholder="09171234567 or +639171234567" value={form.phone}    onChange={set("phone")}    error={errors.phone}/>
              <div style={{ display:"flex",gap:"0.9rem" }}>
                <Field label="Password"         id="password"        type="password" placeholder="Enter password"  value={form.password}        onChange={set("password")}        error={errors.password}        style={{ flex:1 }}/>
                <Field label="Confirm password" id="confirmPassword" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} style={{ flex:1 }}/>
              </div>
              <PasswordStrengthMeter password={form.password} />
              <button className="btn-primary" onClick={()=>goTo(2)}
                style={{ ...btnBase,display:"block",width:"100%",background:"linear-gradient(135deg,#1c4f09,#2a6e10)",color:"#fff",boxShadow:"0 4px 16px rgba(28,79,9,0.25)",marginTop:"0.2rem" }}>
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step===2 && (
            <div className="step-content">

              {/* Address with map pin */}
              <div style={{ marginBottom:"0.95rem", display:"flex", flexDirection:"column" }}>
                <label htmlFor="address" style={{ fontSize:"0.72rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.07em",color:errors.address?"#c03030":"#276010",marginBottom:"0.38rem",fontStyle:"italic" }}>
                  Home Address
                </label>
                <div style={{ position:"relative",display:"flex",gap:"0.5rem",alignItems:"center" }}>
                  <input id="address" type="text" placeholder="Street address" value={form.address} onChange={set("address")} className="field-input"
                    style={{ flex:1,padding:"0.75rem 0.9rem",border:`2px solid ${errors.address?"#d04040":"#5aaa30"}`,borderLeft:errors.address?"4px solid #d04040":"2px solid #5aaa30",borderRadius:10,background:errors.address?"rgba(253,240,240,0.60)":"rgba(255,250,232,0.52)",fontFamily:"'Nunito',sans-serif",fontSize:"0.9rem",fontWeight:600,color:"#222",outline:"none",transition:"border-color 0.18s,box-shadow 0.18s" }}
                  />
                  <button type="button" onClick={() => setShowMap(true)} title="Pick location on map"
                    style={{ flexShrink:0,width:44,height:44,background:"linear-gradient(135deg,#1c4f09,#2a6e10)",border:"none",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 3px 10px rgba(28,79,9,0.30)",transition:"transform 0.15s,box-shadow 0.15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 18px rgba(28,79,9,0.38)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 3px 10px rgba(28,79,9,0.30)";}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 1 8 8c0 5.25-8 13-8 13S4 15.25 4 10a8 8 0 0 1 8-8z"/></svg>
                  </button>
                </div>
                {errors.address && (
                  <span style={{ display:"flex",alignItems:"center",gap:"0.3rem",fontSize:"0.72rem",fontWeight:700,color:"#c03030",marginTop:"0.28rem" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {errors.address}
                  </span>
                )}
              </div>

              <p style={{ fontSize:"0.76rem",fontWeight:700,color:"#5a8a30",marginTop:"-0.5rem",marginBottom:"0.85rem",paddingLeft:"0.15rem",display:"flex",alignItems:"center",gap:"0.35rem" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Helps us match you with nearby animals — use the pin button to auto-fill from the map
              </p>

              <div style={{ display:"flex",gap:"0.9rem" }}>
                <Field label="City / Municipality" id="city"     placeholder="e.g. Quezon City" value={form.city}     onChange={set("city")}     error={errors.city}     style={{ flex:1 }}/>
                <Field label="Province / Region"   id="province" placeholder="e.g. Metro Manila" value={form.province} onChange={set("province")} error={errors.province} style={{ flex:1 }}/>
              </div>

              {/* Smart Zip Field */}
              <ZipField
                city={form.city}
                value={form.zip}
                onChange={set("zip")}
                onSelect={handleZipSelect}
                error={errors.zip}
              />

              <div style={{ display:"flex",gap:"0.9rem",marginTop:"0.4rem" }}>
                <button className="btn-outline" onClick={()=>goTo(1)} style={{ ...btnBase,flex:1,background:"transparent",color:"#1c4f09",border:"2px solid rgba(28,79,9,0.35)",fontWeight:800,fontSize:"0.95rem" }}>← Back</button>
                <button className="btn-primary" onClick={()=>goTo(3)} style={{ ...btnBase,flex:2,background:"linear-gradient(135deg,#1c4f09,#2a6e10)",color:"#fff",boxShadow:"0 4px 16px rgba(28,79,9,0.25)" }}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── Step 3 ── */}
          {step===3 && (
            <div className="step-content">
              <div style={{ marginBottom:"1rem" }}>
                <label style={{ display:"block",fontSize:"0.72rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.07em",color:"#276010",marginBottom:"0.45rem",fontStyle:"italic" }}>
                  Government-Issued ID
                </label>
                <label className="upload-btn" style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:"0.7rem",padding:"1rem 1.2rem",background:idFile?"rgba(210,240,195,0.45)":"rgba(255,250,232,0.52)",border:idFile?"2px solid #5aaa30":"2.5px dashed #5aaa30",borderRadius:12,cursor:"pointer",transition:"background 0.18s,border 0.18s" }}>
                  {idFile ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2a7010" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <span style={{ fontSize:"0.88rem",fontWeight:800,color:"#2a7010" }}>{idFile.name}</span>
                      <span style={{ fontSize:"0.74rem",fontWeight:700,color:"#5a9a40",marginLeft:"auto" }}>✓ Ready</span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a6741" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                      <div>
                        <div style={{ fontSize:"0.88rem",fontWeight:800,color:"#1c4f09" }}>Click to upload ID</div>
                        <div style={{ fontSize:"0.72rem",fontWeight:700,color:"#7a9060" }}>PDF, JPG, or PNG · max 5MB</div>
                      </div>
                    </>
                  )}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:"none" }}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) { setIdFile(f); setUploadLabel("Selected: "+f.name); }
                      else   { setIdFile(null); setUploadLabel("No file selected"); }
                    }}/>
                </label>
                {!idFile && uploadLabel.startsWith("⚠") && (
                  <p style={{ fontSize:"0.74rem",fontWeight:700,color:"#c03030",marginTop:"0.3rem",display:"flex",alignItems:"center",gap:"0.3rem" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Please upload a government-issued ID.
                  </p>
                )}
              </div>

              <div style={{ display:"flex",gap:"0.85rem",alignItems:"flex-start",background:"rgba(255,245,225,0.80)",borderLeft:"4px solid #e07820",borderRadius:10,padding:"0.85rem 1rem",marginBottom:"1rem" }}>
                <div style={{ width:32,height:32,minWidth:32,background:"#e07820",color:"#fff",fontSize:"1rem",fontWeight:900,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontStyle:"italic",flexShrink:0 }}>!</div>
                <div>
                  <p style={{ fontSize:"0.88rem",fontWeight:900,color:"#1c4f09",marginBottom:"0.25rem" }}>Why do we need this?</p>
                  <p style={{ fontSize:"0.80rem",fontWeight:600,color:"#4a5a40",lineHeight:1.55,margin:0 }}>We verify all adopters to ensure the safety and well-being of our rescued animals. Your information is kept secure and confidential.</p>
                </div>
              </div>

              <div style={{ display:"flex",alignItems:"flex-start",gap:"0.55rem",background:"rgba(230,245,220,0.55)",border:"1.5px solid rgba(90,170,48,0.28)",borderRadius:10,padding:"0.8rem 0.95rem",marginBottom:"1.1rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5aaa30" strokeWidth="2.2" style={{ flexShrink:0,marginTop:1 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <p style={{ fontSize:"0.79rem",fontWeight:700,color:"#3a6020",lineHeight:1.55,margin:0 }}>
                  By clicking <strong>Submit</strong>, you'll be asked to review and accept our{" "}
                  <button onClick={()=>{ setPendingSubmit(false); setShowTerms(true); }}
                    style={{ background:"none",border:"none",color:"#c87820",fontWeight:800,fontSize:"0.79rem",fontFamily:"'Nunito',sans-serif",textDecoration:"underline",padding:0 }}>
                    Terms of Service &amp; Privacy Policy
                  </button>
                  {" "}before your account is created.
                  {termsAccepted && <span style={{ color:"#2a7010",fontWeight:800,marginLeft:"0.35rem" }}>✓ Accepted</span>}
                </p>
              </div>

              <div style={{ display:"flex",gap:"0.9rem" }}>
                <button className="btn-outline" onClick={()=>goTo(2)} style={{ ...btnBase,flex:1,background:"transparent",color:"#1c4f09",border:"2px solid rgba(28,79,9,0.35)",fontWeight:800,fontSize:"0.95rem" }}>← Back</button>
                <button className="btn-primary" onClick={handleSubmit} disabled={loading}
                  style={{ ...btnBase,flex:2,background:"linear-gradient(135deg,#d06010,#e07820)",color:"#fff",boxShadow:"0 4px 16px rgba(180,90,20,0.28)",opacity:loading?0.65:1 }}>
                  {loading ? (
                    <span style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:"spin 0.8s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                      Creating…
                    </span>
                  ) : "Submit →"}
                </button>
              </div>
            </div>
          )}

          <p style={{ textAlign:"center",fontSize:"0.85rem",fontWeight:700,color:"#4a6030",marginTop:"1rem" }}>
            Already have an account?{" "}
            <a href="/login" style={{ color:"#c87820",fontStyle:"italic",fontWeight:800,textDecoration:"none" }}>Log in here!</a>
          </p>
        </div>
      </div>
    </>
  );
}