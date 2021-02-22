const express = require('express');
const router = express.Router();
const { Video } = require("../models/Video");

const multer = require("multer");
var ffmpeg = require('fluent-ffmpeg');
const { auth } = require("../middleware/auth");

// STORAGE MULTER CONFIG
let storage = multer.diskStorage({
    destination : (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename : (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    },
    fileFilter : (req, file, cb) => {
        const ext = path.extname(file.originalname)
        if (ext !== '.mp4') {
            return cb(res.status(400).end('only mp4 is allowed'), false);
        }
        cb(null, true);
    }
});

const upload = multer({ storage: storage }).single("file");

//=================================
//             Video
//=================================
router.post('/uploadfiles' , (req, res) => { // req는 클라이언트에서 보낸 파일
    // 클라이언트로부터 받은 비디오를 서버에 저장한다.  =>  npm install multer --save (in Server directory)
    upload(req, res, err => {
        if (err) {
            return res.json({ success: false, err })
        }
        return res.json({ success: true, filePath: res.req.file.path, fileName: res.req.file.filename })
    });
   
});

router.post('/getVideo' , (req, res) => {  // getVideoDetail
    
    Video.findOne({ "_id" : req.body.videoId }) // id 이용해서 비디오 찾는다.
        .populate('writer')
        .exec((err, video) => {
            if(err) return res.status(400).send(err)
            return res.status(200).json({ success : true , video })
        })
    
   
});


router.post("/uploadVideo", (req, res) => {
    // 비디오 정보들을 저장한다.
    const video = new Video(req.body)

    video.save((err, video) => {
        if(err) return res.status(400).json({ success: false, err })
        return res.status(200).json({
            success: true 
        })
    })

});


router.post('/thumbnail' , (req, res) => { // req는 클라이언트에서 보낸 파일
    // 썸네일 생성하고 비디오 러닝타임 정보 가져오기.

    let thumbsFilePath ="";
    let fileDuration ="";


    // 비디오 정보 가져오기 
    ffmpeg.ffprobe(req.body.filePath, function(err, metadata){
        console.dir(metadata);
        console.log(metadata.format.duration);

        fileDuration = metadata.format.duration;
    })
    
    // 썸네일 생성
    ffmpeg(req.body.filePath) // 클라이언트에서 보낸 비디오 저장 경로
    .on('filenames', function (filenames) { // 비디오 썸네일 파일 이름 생성하기.
        console.log('Will generate ' + filenames.join(', '))
        console.log(filenames)
        thumbsFilePath = "uploads/thumbnails/" + filenames[0];

    })
    .on('end', function () { // 썸네일 생성하고 뭐할거냐
        console.log('Screenshots taken');
        return res.json({ success: true, thumbsFilePath: thumbsFilePath, fileDuration: fileDuration})
    })
    .screenshots({
        // Will take screenshots at 20%, 40% , 60% and 80% of the video
        count: 3,
        folder: 'uploads/thumbnails',
        size:'320x240',
        // %b input basename ( filename w/o extension )
        filename:'thumbnail-%b.png'
    });
   
});


router.get('/getVideos', (req, res) => {
    // 비디오를 DB에서 가져와서 클라이언트에 보낸다.
    Video.find()
        .populate('writer') // populate해서 writer의 모든 정보 가져오기.
        .exec((err, videos) => {
            if(err) return res.status(400).send(err);
            res.status(200).json( { success : true , videos })
        })
});

router.post("/getSubscriptionVideos", (req, res) => {


    //Need to find all of the Users that I am subscribing to From Subscriber Collection 
    
    Subscriber.find({ 'userFrom': req.body.userFrom })
    .exec((err, subscribers)=> {
        if(err) return res.status(400).send(err);

        let subscribedUser = [];

        subscribers.map((subscriber, i)=> {
            subscribedUser.push(subscriber.userTo)
        })


        //Need to Fetch all of the Videos that belong to the Users that I found in previous step. 
        Video.find({ writer: { $in: subscribedUser }})
            .populate('writer')
            .exec((err, videos) => {
                if(err) return res.status(400).send(err);
                res.status(200).json({ success: true, videos })
            })
    })
});

module.exports = router;
