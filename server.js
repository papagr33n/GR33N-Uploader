const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(cors());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Multer storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const shortId = Math.random().toString(36).substring(2, 8); // e.g. "a1b2c3"
        cb(null, shortId + ext);
    }
});

const upload = multer({ storage: storage });

const linksFile = path.join(__dirname, 'links.json');
let customLinks = {};
if (fs.existsSync(linksFile)) {
    try {
        customLinks = JSON.parse(fs.readFileSync(linksFile, 'utf8'));
    } catch (e) {
        console.error('Error parsing links.json', e);
    }
}

app.use(express.static('public'));

// Handle upload
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    
    const protocol = req.protocol;
    const host = req.get('host');
    let fileId = path.parse(req.file.filename).name; // e.g. "a1b2c3"
    
    // Map mapping (now just random ID)
    customLinks[fileId] = req.file.filename;
    fs.writeFileSync(linksFile, JSON.stringify(customLinks, null, 2));
    
    const fullUrl = `${protocol}://${host}/${fileId}`;
    
    res.json({
        message: 'File uploaded successfully',
        url: fullUrl
    });
});

// Route for serving images from root
app.get('/:id', (req, res, next) => {
    const filename = customLinks[req.params.id];
    if (filename) {
        res.sendFile(path.join(__dirname, 'uploads', filename));
    } else {
        next(); // pass to 404 handler
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
