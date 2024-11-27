const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    category: {
        type: String,
        enum: ["Income", "Expense", "Investment"], // Predefined categories
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    tags: [
        {
            type: String // Tags to classify the hisab (e.g., Food, Travel)
        }
    ]
},{Timestamp:true});

module.exports = mongoose.model('post', postSchema);
