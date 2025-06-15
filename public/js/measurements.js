document.addEventListener('DOMContentLoaded', () => {
    const addMeasurementBtn = document.getElementById('addMeasurementBtn');
    const measurementModal = document.getElementById('measurementModal');
    const measurementForm = document.getElementById('measurementForm');
    const modalClose = document.querySelector('.modal__close');
    const dateFilter = document.getElementById('dateFilter');
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    const todayBtn = document.getElementById('todayBtn');
    const openCalendarBtn = document.getElementById('openCalendarBtn');
    const weekViewDays = document.querySelector('.week-view__days');
    const weekViewDates = document.querySelector('.week-view__dates');

    // Skróty nazw dni tygodnia
    const dayNames = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];

    // Inicjalizacja widoku tygodnia
    function initializeWeekView() {
        // Dodaj nazwy dni
        weekViewDays.innerHTML = dayNames.map(day => 
            `<div class="week-view__day">${day}</div>`
        ).join('');

        // Wygeneruj widok tygodnia
        updateWeekView();
    }

    // Aktualizacja widoku tygodnia
    function updateWeekView() {
        const currentDate = new Date(dateFilter.value);
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));

        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            dates.push(date);
        }

        weekViewDates.innerHTML = dates.map(date => {
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = date.toDateString() === currentDate.toDateString();
            const classes = ['week-view__date'];
            if (isToday) classes.push('today');
            if (isSelected) classes.push('active');

            return `
                <div class="${classes.join(' ')}" data-date="${date.toISOString().split('T')[0]}">
                    ${date.getDate()}
                </div>
            `;
        }).join('');

        // Dodaj obsługę kliknięć na daty
        document.querySelectorAll('.week-view__date').forEach(dateElement => {
            dateElement.addEventListener('click', () => {
                dateFilter.value = dateElement.dataset.date;
                dateFilter.dispatchEvent(new Event('change'));
            });
        });
    }

    // Aktualizacja tygodnia
    function updateWeek(days) {
        const currentDate = new Date(dateFilter.value);
        currentDate.setDate(currentDate.getDate() + days);
        dateFilter.value = currentDate.toISOString().split('T')[0];
        updateWeekView();
        dateFilter.dispatchEvent(new Event('change'));
    }

    // Inicjalizacja
    if (dateFilter) {
        dateFilter.valueAsDate = new Date();
        initializeWeekView();
    }

    // Obsługa przycisków nawigacji
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => updateWeek(-7));
    }
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => updateWeek(7));
    }
    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            if (dateFilter) {
                dateFilter.valueAsDate = new Date();
                updateWeekView();
                dateFilter.dispatchEvent(new Event('change'));
            }
        });
    }

    // Obsługa przycisku kalendarza
    if (openCalendarBtn) {
        openCalendarBtn.addEventListener('click', () => {
            dateFilter.style.display = 'block';
            dateFilter.showPicker();
            dateFilter.style.display = 'none';
        });
    }

    // Otwieranie modalu do dodawania pomiaru
    addMeasurementBtn.addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'Dodaj Pomiar';
        measurementForm.reset();
        document.getElementById('measurementId').value = '';
        document.getElementById('measurementDate').value = dateFilter.value;
        measurementModal.classList.add('active');
    });

    // Zamykanie modalu
    modalClose.addEventListener('click', closeModal);
    measurementModal.addEventListener('click', (e) => {
        if (e.target === measurementModal) {
            closeModal();
        }
    });

    // Obsługa formularza
    measurementForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(measurementForm);
        const measurementData = Object.fromEntries(formData.entries());
        const measurementId = document.getElementById('measurementId').value;

        try {
            const response = await fetch(`/api/measurements${measurementId ? `/${measurementId}` : ''}`, {
                method: measurementId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(measurementData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Wystąpił błąd podczas zapisywania pomiaru');
            }

            closeModal();
            window.location.reload();
        } catch (error) {
            console.error('Błąd:', error);
            alert(error.message);
        }
    });

    // Filtrowanie pomiarów po dacie
    dateFilter.addEventListener('change', () => {
        const date = dateFilter.value;
        const tables = document.querySelectorAll('.measurements-table');

        tables.forEach(table => {
            const rows = table.querySelectorAll('tr[data-date]');
            const emptyMessage = table.querySelector('.measurements__empty');
            let visibleRows = 0;

            rows.forEach(row => {
                const measurementDate = row.dataset.date;
                const isVisible = !date || measurementDate === date;
                row.style.display = isVisible ? 'table-row' : 'none';
                if (isVisible) visibleRows++;
            });

            // Pokaż/ukryj komunikat o braku pomiarów
            if (emptyMessage) {
                emptyMessage.style.display = visibleRows === 0 ? 'block' : 'none';
            }

            // Pokaż/ukryj tabelę
            const tableElement = table.querySelector('table');
            if (tableElement) {
                tableElement.style.display = visibleRows === 0 ? 'none' : 'table';
            }
        });

        // Aktualizuj widok tygodnia
        updateWeekView();
    });

    // Inicjalizacja widoczności komunikatów o braku pomiarów
    function initializeEmptyMessages() {
        const tables = document.querySelectorAll('.measurements-table');
        tables.forEach(table => {
            const rows = table.querySelectorAll('tr[data-date]');
            const emptyMessage = table.querySelector('.measurements__empty');
            const tableElement = table.querySelector('table');

            if (emptyMessage && tableElement) {
                const isVisible = rows.length > 0;
                emptyMessage.style.display = isVisible ? 'none' : 'block';
                tableElement.style.display = isVisible ? 'table' : 'none';
            }
        });
    }

    // Wywołaj inicjalizację po załadowaniu strony
    initializeEmptyMessages();
});

// Funkcje pomocnicze
function closeModal() {
    const measurementModal = document.getElementById('measurementModal');
    measurementModal.classList.remove('active');
}

function addMeasurement() {
    document.getElementById('modalTitle').textContent = 'Dodaj Pomiar';
    document.getElementById('measurementForm').reset();
    document.getElementById('measurementId').value = '';
    document.getElementById('measurementDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('measurementModal').classList.add('active');
}

async function editMeasurement(measurementId) {
    try {
        const response = await fetch(`/api/measurements/${measurementId}`);
        if (!response.ok) {
            throw new Error('Nie udało się pobrać danych pomiaru');
        }

        const measurement = await response.json();
        document.getElementById('modalTitle').textContent = 'Edytuj Pomiar';
        document.getElementById('measurementId').value = measurement._id;
        document.getElementById('measurementWeight').value = measurement.weight;
        document.getElementById('measurementHeight').value = measurement.height;
        document.getElementById('measurementBiceps').value = measurement.biceps;
        document.getElementById('measurementChest').value = measurement.chest;
        document.getElementById('measurementWaist').value = measurement.waist;
        document.getElementById('measurementHips').value = measurement.hips;
        document.getElementById('measurementThigh').value = measurement.thigh;
        document.getElementById('measurementCalf').value = measurement.calf;
        document.getElementById('measurementDate').value = new Date(measurement.date).toISOString().split('T')[0];
        document.getElementById('measurementNotes').value = measurement.notes || '';

        // Ustaw datę w filtrze na datę pomiaru
        const dateFilter = document.getElementById('dateFilter');
        dateFilter.value = new Date(measurement.date).toISOString().split('T')[0];

        document.getElementById('measurementModal').classList.add('active');
    } catch (error) {
        alert(error.message);
    }
}

async function deleteMeasurement(measurementId) {
    if (!confirm('Czy na pewno chcesz usunąć ten pomiar?')) {
        return;
    }

    try {
        const response = await fetch(`/api/measurements/${measurementId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Wystąpił błąd podczas usuwania pomiaru');
        }

        window.location.reload();
    } catch (error) {
        alert(error.message);
    }
} 