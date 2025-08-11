const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    name:{
        type: String,
        required: true
    },
    auth0Id:{
        type: String,
        required: true,
        sparse: true
    },
    authProvider:{
        type: String,
        enum: ['google', 'local'],
        default: 'local'
    },
    mbtiResults:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MBTIResult',
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
})