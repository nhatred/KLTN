import mongoose from 'mongoose'
import Schema from mongoose.Schema

const Post = new Schema({
    title: {type: String, require: true},
    description: {type: String},
    url: {type: String},
    status: {type:String, enum: ['TO LEARN', 'LEARNING', 'LEARNED']},
    user: {type: Schema.Types.ObjectId, ref: 'users'}
})

export default mongoose.model('posts',Post)