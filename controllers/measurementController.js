const Measurement = require('../models/Measurement');
const { updateGoalsFromMeasurements } = require('./goalController');

// Dodaj nowy pomiar
exports.addMeasurement = async (req, res) => {
    try {
        const measurementData = {
            ...req.body,
            user: req.session.userId
        };
        
        const measurement = new Measurement(measurementData);
        await measurement.save();

        // Aktualizuj cele na podstawie nowego pomiaru
        await updateGoalsFromMeasurements(req.session.userId);
        
        res.status(201).json(measurement);
    } catch (error) {
        console.error('Błąd podczas dodawania pomiaru:', error);
        res.status(400).json({ error: 'Wystąpił błąd podczas dodawania pomiaru' });
    }
};

// Aktualizuj pomiar
exports.updateMeasurement = async (req, res) => {
    try {
        const measurement = await Measurement.findOneAndUpdate(
            { _id: req.params.id, user: req.session.userId },
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!measurement) {
            return res.status(404).json({ error: 'Nie znaleziono pomiaru' });
        }

        // Aktualizuj cele na podstawie zaktualizowanego pomiaru
        await updateGoalsFromMeasurements(req.session.userId);
        
        res.json(measurement);
    } catch (error) {
        console.error('Błąd podczas aktualizacji pomiaru:', error);
        res.status(400).json({ error: 'Wystąpił błąd podczas aktualizacji pomiaru' });
    }
};

// Usuń pomiar
exports.deleteMeasurement = async (req, res) => {
    try {
        const measurement = await Measurement.findOneAndDelete({
            _id: req.params.id,
            user: req.session.userId
        });
        
        if (!measurement) {
            return res.status(404).json({ error: 'Nie znaleziono pomiaru' });
        }

        // Aktualizuj cele na podstawie najnowszego pomiaru
        await updateGoalsFromMeasurements(req.session.userId);
        
        res.json({ message: 'Pomiar został usunięty' });
    } catch (error) {
        console.error('Błąd podczas usuwania pomiaru:', error);
        res.status(500).json({ error: 'Wystąpił błąd podczas usuwania pomiaru' });
    }
}; 