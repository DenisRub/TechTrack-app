import { query } from '../config/database.js';
import { auditLog } from '../middleware/audit.js';
export async function getAllInstruments(filters) {
    let sql = `
    SELECT mi.instrument_id, mi.name, mi.manufacturer, mi.model, 
           mi.serial_number, mi.inventory_number, mi.tab_number,
           mi.status, mi.location, mi.note,
           mi.calibration_date, mi.calibration_interval, mi.next_calibration_date,
           mi.created_at, mi.updated_at,
           (SELECT result FROM equipment.calibration_history 
            WHERE instrument_id = mi.instrument_id 
            ORDER BY calibration_date DESC LIMIT 1) as last_calibration_result
    FROM equipment.measuring_instruments mi
    WHERE mi.status != 'списано'
  `;
    const conditions = [];
    const values = [];
    let paramIndex = 1;
    if (filters?.status) {
        conditions.push(`mi.status = $${paramIndex++}`);
        values.push(filters.status);
    }
    if (filters?.search) {
        conditions.push(`(mi.name ILIKE $${paramIndex++} OR mi.manufacturer ILIKE $${paramIndex} OR mi.model ILIKE $${paramIndex} OR mi.tab_number ILIKE $${paramIndex})`);
        const searchPattern = `%${filters.search}%`;
        values.push(searchPattern, searchPattern, searchPattern);
        paramIndex++;
    }
    if (filters?.location) {
        conditions.push(`mi.location ILIKE $${paramIndex++}`);
        values.push(`%${filters.location}%`);
    }
    if (conditions.length > 0) {
        sql += ' AND ' + conditions.join(' AND ');
    }
    sql += ` ORDER BY mi.next_calibration_date NULLS LAST`;
    const result = await query(sql, values);
    return result.rows;
}
export async function getInstrumentById(instrumentId) {
    const result = await query(`SELECT mi.instrument_id, mi.name, mi.manufacturer, mi.model, 
            mi.serial_number, mi.inventory_number, mi.tab_number,
            mi.status, mi.location, mi.note,
            mi.calibration_date, mi.calibration_interval, mi.next_calibration_date,
            mi.created_at, mi.updated_at,
            (SELECT json_agg(json_build_object(
               'history_id', ch.history_id,
               'calibration_date', ch.calibration_date,
               'next_calibration_date', ch.next_calibration_date,
               'calibrator', ch.calibrator,
               'certificate_number', ch.certificate_number,
               'result', ch.result,
               'notes', ch.notes,
               'performed_at', ch.performed_at
             ) ORDER BY ch.calibration_date DESC)
             FROM equipment.calibration_history ch
             WHERE ch.instrument_id = mi.instrument_id) as calibration_history
     FROM equipment.measuring_instruments mi
     WHERE mi.instrument_id = $1`, [instrumentId]);
    if (result.rows.length === 0)
        return null;
    return result.rows[0];
}
export async function getInstrumentByTabNumber(tabNumber) {
    const result = await query(`SELECT instrument_id, name, manufacturer, model, tab_number, status
     FROM equipment.measuring_instruments
     WHERE tab_number = $1 AND status != 'списано'`, [tabNumber]);
    return result.rows[0] || null;
}
export async function getInstrumentCalibrationHistory(instrumentId) {
    const result = await query(`SELECT history_id, calibration_date, next_calibration_date,
            calibrator, certificate_number, result, notes, performed_at
     FROM equipment.calibration_history
     WHERE instrument_id = $1
     ORDER BY calibration_date DESC`, [instrumentId]);
    return result.rows;
}
export async function getInstrumentsExpiringSoon(daysThreshold = 30) {
    const result = await query(`SELECT mi.instrument_id, mi.name, mi.tab_number, mi.next_calibration_date,
            mi.location, mi.status,
            (mi.next_calibration_date - CURRENT_DATE) as days_until_expiry
     FROM equipment.measuring_instruments mi
     WHERE mi.status NOT IN ('списано', 'на поверке')
       AND mi.next_calibration_date IS NOT NULL
       AND mi.next_calibration_date - CURRENT_DATE <= $1
       AND mi.next_calibration_date >= CURRENT_DATE
     ORDER BY mi.next_calibration_date`, [daysThreshold]);
    return result.rows;
}
export async function getInstrumentsExpired() {
    const result = await query(`SELECT mi.instrument_id, mi.name, mi.tab_number, mi.next_calibration_date,
            mi.location, mi.status
     FROM equipment.measuring_instruments mi
     WHERE mi.status NOT IN ('списано')
       AND mi.next_calibration_date IS NOT NULL
       AND mi.next_calibration_date < CURRENT_DATE
     ORDER BY mi.next_calibration_date`);
    return result.rows;
}
export async function createInstrument(data, userId, ipAddress, userAgent) {
    // Проверяем уникальность табельного номера
    const existing = await getInstrumentByTabNumber(data.tab_number);
    if (existing) {
        throw new Error('Средство измерения с таким табельным номером уже существует');
    }
    const result = await query(`INSERT INTO equipment.measuring_instruments (
       instrument_id, name, manufacturer, model, serial_number,
       inventory_number, tab_number, status, calibration_date,
       calibration_interval, location, note
     ) VALUES (
       uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
     ) RETURNING instrument_id, name, tab_number, calibration_date, next_calibration_date`, [
        data.name,
        data.manufacturer,
        data.model,
        data.serial_number || null,
        data.inventory_number || null,
        data.tab_number,
        data.status || 'в эксплуатации',
        data.calibration_date || null,
        data.calibration_interval,
        data.location,
        data.note || null,
    ]);
    const newInstrument = result.rows[0];
    await auditLog(userId, 'CREATE_INSTRUMENT', 'measuring_instrument', newInstrument.instrument_id, null, newInstrument, ipAddress, userAgent);
    return newInstrument;
}
export async function updateInstrument(instrumentId, data, userId, ipAddress, userAgent) {
    const oldData = await getInstrumentById(instrumentId);
    if (!oldData) {
        throw new Error('Средство измерения не найдено');
    }
    // Если меняется табельный номер, проверяем уникальность
    if (data.tab_number && data.tab_number !== oldData.tab_number) {
        const existing = await getInstrumentByTabNumber(data.tab_number);
        if (existing && existing.instrument_id !== instrumentId) {
            throw new Error('Средство измерения с таким табельным номером уже существует');
        }
    }
    const updates = [];
    const values = [];
    let paramIndex = 1;
    if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
    }
    if (data.manufacturer !== undefined) {
        updates.push(`manufacturer = $${paramIndex++}`);
        values.push(data.manufacturer);
    }
    if (data.model !== undefined) {
        updates.push(`model = $${paramIndex++}`);
        values.push(data.model);
    }
    if (data.serial_number !== undefined) {
        updates.push(`serial_number = $${paramIndex++}`);
        values.push(data.serial_number);
    }
    if (data.inventory_number !== undefined) {
        updates.push(`inventory_number = $${paramIndex++}`);
        values.push(data.inventory_number);
    }
    if (data.tab_number !== undefined) {
        updates.push(`tab_number = $${paramIndex++}`);
        values.push(data.tab_number);
    }
    if (data.status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(data.status);
    }
    if (data.calibration_date !== undefined) {
        updates.push(`calibration_date = $${paramIndex++}`);
        values.push(data.calibration_date);
    }
    if (data.calibration_interval !== undefined) {
        updates.push(`calibration_interval = $${paramIndex++}`);
        values.push(data.calibration_interval);
    }
    if (data.location !== undefined) {
        updates.push(`location = $${paramIndex++}`);
        values.push(data.location);
    }
    if (data.note !== undefined) {
        updates.push(`note = $${paramIndex++}`);
        values.push(data.note);
    }
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    if (updates.length === 0) {
        return oldData;
    }
    values.push(instrumentId);
    await query(`UPDATE equipment.measuring_instruments SET ${updates.join(', ')} WHERE instrument_id = $${paramIndex}`, values);
    const newData = await getInstrumentById(instrumentId);
    await auditLog(userId, 'UPDATE_INSTRUMENT', 'measuring_instrument', instrumentId, oldData, newData, ipAddress, userAgent);
    return newData;
}
export async function writeOffInstrument(instrumentId, userId, ipAddress, userAgent) {
    const oldData = await getInstrumentById(instrumentId);
    if (!oldData) {
        throw new Error('Средство измерения не найдено');
    }
    await query(`UPDATE equipment.measuring_instruments SET status = 'списано', updated_at = CURRENT_TIMESTAMP WHERE instrument_id = $1`, [instrumentId]);
    await auditLog(userId, 'WRITE_OFF_INSTRUMENT', 'measuring_instrument', instrumentId, oldData, { status: 'списано' }, ipAddress, userAgent);
    return { success: true };
}
export async function addCalibrationHistory(instrumentId, data, userId, ipAddress, userAgent) {
    const instrument = await getInstrumentById(instrumentId);
    if (!instrument) {
        throw new Error('Средство измерения не найдено');
    }
    // Рассчитываем следующую дату поверки, если не указана
    let nextCalibrationDate = data.next_calibration_date;
    if (!nextCalibrationDate && data.calibration_date && instrument.calibration_interval) {
        const calDate = new Date(data.calibration_date);
        calDate.setFullYear(calDate.getFullYear() + instrument.calibration_interval);
        nextCalibrationDate = calDate.toISOString().split('T')[0];
    }
    const result = await query(`INSERT INTO equipment.calibration_history (
       history_id, instrument_id, calibration_date, next_calibration_date,
       calibrator, certificate_number, result, notes, performed_by_user
     ) VALUES (
       uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8
     ) RETURNING history_id, calibration_date, next_calibration_date`, [
        instrumentId,
        data.calibration_date,
        nextCalibrationDate,
        data.calibrator,
        data.certificate_number || null,
        data.result,
        data.notes || null,
        userId,
    ]);
    await auditLog(userId, 'ADD_CALIBRATION', 'calibration_history', result.rows[0].history_id, null, data, ipAddress, userAgent);
    return result.rows[0];
}
