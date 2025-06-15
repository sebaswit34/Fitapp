const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    measurementType: {
        type: String,
        enum: ['weight', 'chest', 'biceps', 'waist', 'hips', 'thigh', 'calf'],
        required: true
    },
    initialValue: {
        type: Number,
        required: true,
        min: 0
    },
    currentValue: {
        type: Number,
        required: true,
        min: 0
    },
    targetValue: {
        type: Number,
        required: true,
        min: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'failed'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Walidacja dat
goalSchema.pre('save', function(next) {
    if (this.startDate >= this.endDate) {
        next(new Error('Data rozpoczęcia musi być wcześniejsza niż data zakończenia'));
    }
    next();
});

// Aktualizacja statusu na podstawie postępu i daty
goalSchema.methods.updateStatus = function() {
    if (this.progress >= 100) {
        this.status = 'completed';
    } else if (new Date() > this.endDate && this.progress < 100) {
        this.status = 'failed';
    } else {
        this.status = 'active';
    }
};

// Obliczanie postępu
goalSchema.methods.calculateProgress = function() {
    const totalChange = this.targetValue - this.currentValue;
    const currentChange = this.currentValue - this.currentValue; // To będzie aktualizowane na podstawie pomiarów
    this.progress = Math.round((currentChange / totalChange) * 100);
    this.updateStatus();
};

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal; 