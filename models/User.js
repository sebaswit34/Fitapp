const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    age: {
        type: Number,
        required: true,
        min: 16,
        max: 100
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    height: {
        type: Number,
        required: true,
        min: 100,
        max: 250
    },
    weight: {
        type: Number,
        required: true,
        min: 30,
        max: 300
    },
    activity: {
        type: String,
        enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
        required: true
    },
    goal: {
        type: String,
        enum: ['lose_weight', 'maintain', 'gain_weight'],
        required: true
    },
    goals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Goal'
    }],
    measurements: [{
        date: {
            type: Date,
            required: true
        },
        weight: {
            type: Number,
            min: 0
        },
        height: {
            type: Number,
            min: 0
        },
        chest: {
            type: Number,
            min: 0
        },
        waist: {
            type: Number,
            min: 0
        },
        hips: {
            type: Number,
            min: 0
        },
        biceps: {
            type: Number,
            min: 0
        },
        thigh: {
            type: Number,
            min: 0
        }
    }],
    meals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meal'
    }],
    dailyGoals: {
        calories: {
            type: Number,
            default: 2000
        },
        protein: {
            type: Number,
            default: 150
        },
        carbs: {
            type: Number,
            default: 250
        },
        fat: {
            type: Number,
            default: 70
        },
        proteinPercentage: {
            type: Number,
            default: 30
        },
        carbsPercentage: {
            type: Number,
            default: 40
        },
        fatPercentage: {
            type: Number,
            default: 30
        }
    }
}, {
    timestamps: true
});

// Hashowanie hasła przed zapisem
userSchema.pre('save', async function(next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

// Metoda do porównywania haseł
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Metoda do pobierania ostatnich pomiarów
userSchema.methods.getLatestMeasurements = function() {
    return this.measurements.sort((a, b) => b.date - a.date)[0];
};

// Metoda do pobierania aktywnych celów
userSchema.methods.getActiveGoals = async function() {
    await this.populate('goals');
    return this.goals.filter(goal => goal.status === 'active');
};

// Metoda do pobierania celów według typu
userSchema.methods.getGoalsByType = async function(type) {
    await this.populate('goals');
    return this.goals.filter(goal => goal.type === type);
};

// Metoda do obliczania BMR (podstawowej przemiany materii)
userSchema.methods.calculateBMR = function() {
    // Wzór Mifflin-St Jeor
    let bmr;
    if (this.gender === 'male') {
        bmr = (10 * this.weight) + (6.25 * this.height) - (5 * this.age) + 5;
    } else {
        bmr = (10 * this.weight) + (6.25 * this.height) - (5 * this.age) - 161;
    }
    return Math.round(bmr);
};

// Metoda do obliczania TDEE (całkowitej przemiany materii)
userSchema.methods.calculateTDEE = function() {
    const bmr = this.calculateBMR();
    let activityMultiplier;

    switch (this.activity) {
        case 'sedentary':
            activityMultiplier = 1.2; // Siedzący tryb życia
            break;
        case 'light':
            activityMultiplier = 1.375; // Lekko aktywny (1-3 treningi/tydzień)
            break;
        case 'moderate':
            activityMultiplier = 1.55; // Umiarkowanie aktywny (3-5 treningów/tydzień)
            break;
        case 'active':
            activityMultiplier = 1.725; // Aktywny (6-7 treningów/tydzień)
            break;
        case 'very_active':
            activityMultiplier = 1.9; // Bardzo aktywny (codzienny trening)
            break;
        default:
            activityMultiplier = 1.2;
    }

    return Math.round(bmr * activityMultiplier);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 