import LegalLayout from './LegalLayout';

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="June 2026">
      <h2>1. Information We Collect</h2>
      <p>When you submit an enquiry, reservation request, or catering/gifting form on our website, we collect the personal information you voluntarily provide, including your name, email address, phone number, and message content. We do not collect payment card details through this website.</p>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information you provide to:</p>
      <ul>
        <li>Respond to your enquiries and reservation requests.</li>
        <li>Communicate reservation confirmations and follow-ups via email or WhatsApp.</li>
        <li>Improve our service based on internal review of submissions.</li>
      </ul>
      <p>We do not sell or rent your personal information to third parties.</p>

      <h2>3. Data Storage</h2>
      <p>Your submitted information is stored securely in our cloud database. Access to your data is restricted to authorised Malwa Namkeen House staff. We implement administrative and technical security measures to safeguard your personal data.</p>

      <h2>4. Data Retention</h2>
      <p>We retain reservation and enquiry records for as long as necessary for business and legal purposes. You may request deletion of your data at any time by contacting us at the address below, and we will respond within a reasonable timeframe.</p>

      <h2>5. Cookies</h2>
      <p>This website does not intentionally use third-party tracking or advertising cookies. If you notice unexpected cookies, please contact us so we can investigate.</p>

      <h2>6. Third-Party Services</h2>
      <p>Our website uses the following third-party services:</p>
      <ul>
        <li><strong>MongoDB Atlas</strong> — cloud database hosting.</li>
        <li><strong>Resend</strong> — transactional email delivery.</li>
        <li><strong>Cloudinary</strong> — media and image asset delivery.</li>
      </ul>
      <p>These services operate under their own privacy policies and data processing agreements.</p>

      <h2>7. Your Rights</h2>
      <p>You have the right to request access to, correction of, or deletion of the personal data we hold about you. To exercise these rights, please contact us at <a href="mailto:malwanamkeenhouse@gmail.com">malwanamkeenhouse@gmail.com</a>.</p>

      <h2>8. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. The "Last Updated" date at the top of this page reflects the most recent revision. Continued use of our website after any changes constitutes acceptance of the revised policy.</p>

      <h2>9. Contact</h2>
      <p>MALWA NAMKEEN HOUSE, Indore, Madhya Pradesh, India.<br />Email: <a href="mailto:malwanamkeenhouse@gmail.com">malwanamkeenhouse@gmail.com</a></p>
    </LegalLayout>
  );
}
