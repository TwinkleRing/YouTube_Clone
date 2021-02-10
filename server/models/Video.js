const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const videoSchema = mongoose.Schema({

    writer : {
        type : Schema.Types.ObjectId, // Id만 넣어도 User 모델에 가서 모든 정보들을 다 불러 올 수 있다.
        ref : 'User' // User에서 불러온다.
    },
    title : {
        type : String,
        maxlength : 50
    },
    descripion : {
        type : String
    },
    privacy : {
        type : Number
    },
    filePath : {
        type : String
    },
    category : {
        type : String
    },
    views : {
        type : Number,
        default : 0 // 조회수는 0부터 시작.
    },
    duration : {
        type : String
    },
    thumbnail : {
        type : String
    }

    
} , { timestamps : true })

const Video = mongoose.model('Video', videoSchema);

module.exports = { Video }