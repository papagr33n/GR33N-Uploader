require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { sql } = require('@vercel/postgres');

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

app.use(express.static('public'));

// Handle upload
app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    
    const protocol = req.protocol;
    const host = req.get('host');
    let fileId = path.parse(req.file.filename).name; // e.g. "a1b2c3"
    
    try {
        // Insert into PostgreSQL
        await sql`INSERT INTO images (id, filename) VALUES (${fileId}, ${req.file.filename}) ON CONFLICT DO NOTHING;`;
        
        const fullUrl = `${protocol}://${host}/${fileId}`;
        
        res.json({
            message: 'File uploaded successfully',
            url: fullUrl
        });
    } catch (error) {
        console.error('Error saving image metadata:', error);
        res.status(500).json({ error: 'Failed to save image metadata.' });
    }
});

// Route for serving images from root
app.get('/:id', async (req, res, next) => {
    try {
        const { rows } = await sql`SELECT filename FROM images WHERE id = ${req.params.id} LIMIT 1;`;
        
        if (rows.length > 0) {
            const filename = rows[0].filename;
            res.sendFile(path.join(__dirname, 'uploads', filename));
        } else {
            next(); // pass to 404 handler
        }
    } catch (error) {
        console.error('Error fetching image metadata:', error);
        next();
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

