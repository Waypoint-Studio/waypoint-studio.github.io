import { useState, type ChangeEvent, type FormEvent, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { Icon } from '@/components/icons';
import { useToast } from '@/components/toast';
import { Card, PageHeader } from '@/components/ui';
import { RECEPTION_CONDITIONS, TECHNICIANS, formatMoney } from '@/domain/labels';
import { errorMessage } from '@/hooks/use-query';
import { compressPhoto } from '@/lib/image';

const BRANDS: readonly string[] = ['Samsung', 'Apple', 'Xiaomi', 'Motorola', 'Tecno', 'Oppo', 'Honor', 'Infinix', 'Huawei', 'Otra'];
const MAX_PHOTOS = 4;

interface FormState {
  name: string;
  phone: string;
  brand: string;
  model: string;
  color: string;
  issue: string;
  conditions: string[];
  photos: string[];
  estimate: string;
  deposit: string;
  technician: string;
}

const INITIAL: FormState = {
  name: '',
  phone: '+57 ',
  brand: 'Samsung',
  model: '',
  color: '',
  issue: '',
  conditions: ['Enciende'],
  photos: [],
  estimate: '',
  deposit: '',
  technician: TECHNICIANS[0] ?? '',
};

const toAmount = (value: string): number => Number(value.replaceAll(/\D/g, '')) || 0;

export const NewOrderPage = (): ReactElement => {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [saving, setSaving] = useState(false);

  const set =
    (field: keyof Omit<FormState, 'conditions' | 'photos'>) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void =>
      setForm((current) => ({ ...current, [field]: event.target.value }));

  const toggleCondition = (condition: string): void =>
    setForm((current) => ({
      ...current,
      conditions: current.conditions.includes(condition)
        ? current.conditions.filter((item) => item !== condition)
        : [...current.conditions, condition],
    }));

  const addPhotos = (event: ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(event.target.files ?? []).slice(0, MAX_PHOTOS - form.photos.length);
    event.target.value = '';
    Promise.all(files.map(compressPhoto))
      .then((photos) => setForm((current) => ({ ...current, photos: [...current.photos, ...photos] })))
      .catch((error: unknown) => toast.fail(errorMessage(error)));
  };

  const removePhoto = (index: number): void =>
    setForm((current) => ({ ...current, photos: current.photos.filter((_, position) => position !== index) }));

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setSaving(true);
    api
      .createOrder({
        customer: { name: form.name, phone: form.phone },
        device: { brand: form.brand, model: form.model.trim(), color: form.color.trim() },
        issue: form.issue,
        conditions: form.conditions,
        photos: form.photos,
        estimate: toAmount(form.estimate),
        deposit: toAmount(form.deposit),
        technician: form.technician,
      })
      .then((result) => {
        toast.whatsapp(result.message);
        navigate(`/ordenes/${result.order.id}`);
      })
      .catch((error: unknown) => {
        toast.fail(errorMessage(error));
        setSaving(false);
      });
  };

  const estimate = toAmount(form.estimate);
  const deposit = toAmount(form.deposit);

  return (
    <form className="page" onSubmit={submit}>
      <PageHeader title="Recibir equipo" subtitle="Al guardar, el cliente recibe por WhatsApp su comprobante y el enlace de seguimiento." />

      <Card>
        <h2 className="card__title">Cliente</h2>
        <div className="fields">
          <label className="field">
            <span>Nombre</span>
            <input required value={form.name} onChange={set('name')} autoComplete="name" placeholder="Ej: Laura Pérez" />
          </label>
          <label className="field">
            <span>WhatsApp</span>
            <input required type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" />
          </label>
        </div>
      </Card>

      <Card>
        <h2 className="card__title">Equipo</h2>
        <div className="fields fields--3">
          <label className="field">
            <span>Marca</span>
            <select value={form.brand} onChange={set('brand')}>
              {BRANDS.map((brand) => (
                <option key={brand}>{brand}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Modelo</span>
            <input required value={form.model} onChange={set('model')} placeholder="Ej: Galaxy A54" />
          </label>
          <label className="field">
            <span>Color</span>
            <input value={form.color} onChange={set('color')} placeholder="Ej: Negro" />
          </label>
        </div>
        <label className="field">
          <span>Falla que reporta el cliente</span>
          <textarea required rows={2} value={form.issue} onChange={set('issue')} placeholder="Ej: Se cayó y la pantalla no responde" />
        </label>
        <fieldset className="field">
          <legend>Estado en que se recibe</legend>
          <div className="toggles">
            {RECEPTION_CONDITIONS.map((condition) => (
              <button
                key={condition}
                type="button"
                aria-pressed={form.conditions.includes(condition)}
                className={`toggle${form.conditions.includes(condition) ? ' toggle--on' : ''}`}
                onClick={() => toggleCondition(condition)}
              >
                {condition}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="field">
          <span>Fotos al recibir ({form.photos.length}/{MAX_PHOTOS})</span>
          <div className="photos">
            {form.photos.map((photo, index) => (
              <button key={photo.slice(-24)} type="button" className="photo" onClick={() => removePhoto(index)} aria-label="Quitar foto">
                <img src={photo} alt={`Foto ${index + 1} del equipo`} />
              </button>
            ))}
            {form.photos.length < MAX_PHOTOS ? (
              <label className="photo photo--add">
                <Icon name="camera" />
                <span>Agregar</span>
                <input type="file" accept="image/*" capture="environment" multiple onChange={addPhotos} hidden />
              </label>
            ) : null}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="card__title">Valores</h2>
        <div className="fields fields--3">
          <label className="field">
            <span>Valor estimado</span>
            <input inputMode="numeric" value={form.estimate} onChange={set('estimate')} placeholder="Ej: 150000" />
          </label>
          <label className="field">
            <span>Abono</span>
            <input inputMode="numeric" value={form.deposit} onChange={set('deposit')} placeholder="Ej: 50000" />
          </label>
          <label className="field">
            <span>Técnico</span>
            <select value={form.technician} onChange={set('technician')}>
              {TECHNICIANS.map((technician) => (
                <option key={technician}>{technician}</option>
              ))}
            </select>
          </label>
        </div>
        {estimate > 0 ? (
          <p className="muted">
            Saldo estimado al entregar: <strong>{formatMoney(Math.max(0, estimate - deposit))}</strong>
          </p>
        ) : null}
      </Card>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          <Icon name="whatsapp" size={18} />
          {saving ? 'Guardando…' : 'Guardar y enviar comprobante'}
        </button>
      </div>
    </form>
  );
};
