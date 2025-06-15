const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    // Podstawowe pomiary
    weight: {
        type: Number,
        required: true,
        min: 0
    },
    height: {
        type: Number,
        required: true,
        min: 0
    },
    // Pomiary obwodów
    biceps: {
        type: Number,
        required: true,
        min: 0,
        comment: 'Obwód ramienia (biceps) w cm'
    },
    chest: {
        type: Number,
        required: true,
        min: 0,
        comment: 'Obwód klatki piersiowej w cm'
    },
    waist: {
        type: Number,
        required: true,
        min: 0,
        comment: 'Obwód talii w cm'
    },
    hips: {
        type: Number,
        required: true,
        min: 0,
        comment: 'Obwód bioder w cm'
    },
    thigh: {
        type: Number,
        required: true,
        min: 0,
        comment: 'Obwód uda w cm'
    },
    calf: {
        type: Number,
        required: true,
        min: 0,
        comment: 'Obwód łydki w cm'
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indeks dla szybszego wyszukiwania pomiarów użytkownika
measurementSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Measurement', measurementSchema); 