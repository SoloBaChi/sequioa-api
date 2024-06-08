const fs = require("fs");

const readLogoFile = async (req, res) => {
  // get the logo image
  const logoBuffer = fs.readFileSync(`${__dirname}/../assets/sequioa-logo.png`);

  try {
    // Convert the image buffer to a base64 string
    const logoBase64 = logoBuffer.toString("base64");

    const logoSrc = `data:image/png;base64,${logoBase64}`;

     return res.json(logoSrc);
  } catch (err) {
    console.log(err);
  }
};

module.exports = readLogoFile;
