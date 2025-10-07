import { useState, FormEvent } from 'react';
import { MapPin, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([formData]);

      if (error) throw error;

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Verein</h1>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Adressen</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Meisterschaftsrunden</h3>
              <div className="space-y-2 text-gray-700">
                <p className="font-medium">Sporthalle Schüpfen</p>
                <p>Schulstrasse 15, 3054 Schüpfen</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Trainingsbetrieb</h3>
              <div className="space-y-4 text-gray-700">
                <div>
                  <p className="font-medium">Sporthalle Schüpfen</p>
                  <p>Schulstrasse 15, 3054 Schüpfen</p>
                </div>
                <div>
                  <p className="font-medium">Sporthalle Busswil</p>
                  <p>Bahnhofstrasse 23, 3292 Busswil</p>
                </div>
                <div>
                  <p className="font-medium">Sporthalle Grenchsel</p>
                  <p>Grentzachelstrasse 3, 3250 Lyss</p>
                </div>
                <div>
                  <p className="font-medium">Sporthalle Nispoly</p>
                  <p>Oberer Aarweg 35, 3250 Lyss</p>
                </div>
                <div>
                  <p className="font-medium">Schulanlage Staffel</p>
                  <p>Schulhausstrasse 23, 3302 Moosseedorf</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg overflow-hidden mb-16">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2704.648753166983!2d7.334456776919635!3d47.32578111116675!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x478e09b8e3b5f8a3%3A0xf67af9a03b105c53!2sSporthalle%20Sch%C3%BCpfen!5e0!3m2!1sde!2sch!4v1709738400000!5m2!1sde!2sch"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Kontaktieren sie uns</h2>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              Vielen Dank für Ihre Nachricht! Wir werden uns bald bei Ihnen melden.
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Ihr Vorname *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Geben Sie Ihren Vornamen ein"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Ihre E-Mail *
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Geben Sie Ihre E-Mail-Adresse ein"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Ihre Telefonnummer
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Geben Sie Ihre Telefonnummer ein (optional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Ihre Nachricht *
              </label>
              <textarea
                id="message"
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Geben Sie Ihre Nachricht ein"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Wird gesendet...' : 'Nachricht absenden'}
            </button>
          </form>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">KONTAKT</h3>
              <p className="text-gray-600 text-sm">UHC White Wings Schüpfen-Busswil Postfach 211</p>
              <p className="text-gray-600 text-sm">3054 Schüpfen</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">EMAIL</h3>
              <a href="mailto:info@whitewings.ch" className="text-blue-600 hover:text-blue-700">
                info@whitewings.ch
              </a>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">TELEFON</h3>
              <p className="text-gray-600 text-sm">3054 Schüpfen</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
