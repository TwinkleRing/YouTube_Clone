const express = require('express');
const router = express.Router();
const { Video } = require("../models/Video");

const { auth } = require("../middleware/auth");
const multer = require("multer");
var ffmpeg = require("fluent-ffmpeg");

// STORAGE MULTER CONFIG
let storage = multer.diskStorage({
    destination : (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename :(req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    },
    fileFilter : (req, file, cb) => {
        const ext = path.extname(file.originalname)
        if (ext !== '.mp4') {
            return cb(res.status(400).end('only mp4 is allowed'), false);
        }
        cb(null, true)
    }
});

const upload = multer({ storage : storage }).single('file');

//=================================
//             Video
//=================================

router.post('/uploadfiles' , (req, res) => { // req는 클라이언트에서 보낸 파일
    // 클라이언트로부터 받은 비디오를 서버에 저장한다.  =>  npm install multer --save (in Server directory)
    upload(req, res, err => {
        if (err) {
            return res.json({ success : false, err})
        }
        return res.json({ success : true, url: res.req.file.path, filename: res.req.file.filename })
    })
   
})

router.post('/thumbnail' , (req, res) => { // req는 클라이언트에서 보낸 파일
    // 썸네일 생성하고 비디오 러닝타임 정보 가져오기.

    let filePath = ""
    let fileDuration = ""

    // 비디오 정보 가져오기 

    // 썸네일 생성
    ffmpeg(req.body.url) // 클라이언트에서 보낸 비디오 저장 경로
    .on('filenames', function (filenames) { // 비디오 썸네일 파일 이름 생성하기.
        console.log('Will generate ' + filenames.join(', '))
        console.log(filenames)

        filePath = "upload/thumbnails/" + filenames[0]
    })
    .on('end', function ()  { // 썸네일 생성하고 뭐할거냐
        console.log("Screenshots taken");
        return res.json({ success : true, url : filePath , fileDuration : fileDuration });
    })
    .on('error', function (err) {
        console.error(err);
        return res.json( { success : false , err });
    })
    .screenshot({
        // Will take screenshots at 20%, 40% , 60% and 80% of the video
        count : 3,
        folder : 'uploads/thumbnails',
        size : '320x240',
        // %b input basename ( filename w/o extension )
        filename :'thumbnail-%b.png'
    })
   
})


module.exports = router;
