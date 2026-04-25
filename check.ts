import fs from "fs";
console.log("Logo.jpeg size:", fs.existsSync("public/Logo.jpeg") ? fs.statSync("public/Logo.jpeg").size : "not found");
console.log("logo.png size:", fs.existsSync("public/logo.png") ? fs.statSync("public/logo.png").size : "not found");
