import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white font-dmsans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-semibold mb-6">HEKA — Policy & Legal Terms</h1>
        <p className="mb-4 text-gray-700">Last Updated: November 2025</p>

        {/* -----------------------------------------------------
            PRIVACY POLICY
        ----------------------------------------------------- */}
        <h2 className="text-2xl font-bold mb-4">Privacy Policy</h2>
        <p className="text-gray-700 mb-6">
          Rudraksh Foundation (“we,” “our,” “us”) operates the HEKA application and
          www.rfheka.com. We are committed to protecting your privacy and ensuring
          transparency regarding how your information is handled.
        </p>

        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-2">1. Information We Collect</h3>
          <ul className="list-disc list-inside text-gray-700">
            <li>Personal Information: name, phone, email, age, gender, location, uploaded documents.</li>
            <li>Health-Related Information voluntarily provided such as symptoms and basic medical details.</li>
            <li>Device & analytical data such as cookies, IP address and usage metrics.</li>
            <li>Third-party login details (when used to sign in).</li>
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-2">2. How We Use Your Information</h3>
          <ul className="list-disc list-inside text-gray-700">
            <li>Facilitate patient support and coordination.</li>
            <li>Connect users with hospitals and guest houses.</li>
            <li>Improve app features and user experience.</li>
            <li>Send necessary alerts, notifications and communication.</li>
            <li>Meet legal and compliance requirements.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-2">3. Sharing of Information</h3>
          <ul className="list-disc list-inside text-gray-700">
            <li>With partner hospitals and guest houses for service coordination.</li>
            <li>With technology/IT service providers for analytics, cloud hosting and support.</li>
            <li>When legally required by authorities.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-2">4. Data Security</h3>
          <p className="text-gray-700">
            We use encryption, secure servers and access-controlled systems, but no method
            of online storage or transmission is 100% secure.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-2">5. Your Rights</h3>
          <ul className="list-disc list-inside text-gray-700">
            <li>Access, correct or delete your personal information.</li>
            <li>Withdraw consent anytime.</li>
            <li>Restrict processing of your information.</li>
            <li>Request a copy of stored data.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-2">6. Cookies & Tracking</h3>
          <p className="text-gray-700">
            Cookies are used for analytics, performance and personalization. Users may
            disable cookies through browser settings, but certain features may be affected.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-2">7. Children’s Privacy</h3>
          <p className="text-gray-700">
            HEKA is not meant for children under age 16. If a guardian believes a child
            submitted personal information, please contact us for removal.
          </p>
        </section>

        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-2">8. Data Retention</h3>
          <p className="text-gray-700">
            We retain data only for as long as required to provide services and meet legal obligations.
          </p>
        </section>



        {/* -----------------------------------------------------
            TERMS & CONDITIONS
        ----------------------------------------------------- */}
        <h2 className="text-2xl font-bold mb-4">Terms & Conditions</h2>

        <section className="mb-6 text-gray-700">
          <ul className="list-disc list-inside">
            <li>HEKA is a digital healthcare assistance platform — not a provider of medical treatment or clinical advice.</li>
            <li>Users must provide accurate information and not misuse the platform.</li>
            <li>Service quality, charges and scheduling are the responsibility of partner hospitals/guest houses.</li>
            <li>HEKA does not charge patients; commissions come from partners.</li>
            <li>Bookings and appointments are subject to availability; HEKA is not liable for delays or cancellations.</li>
            <li>All content and branding belong to Rudraksh Foundation.</li>
            <li>HEKA is not responsible for medical outcomes or third-party actions.</li>
            <li>External web links are not under HEKA’s control.</li>
            <li>Violations may result in account termination.</li>
            <li>Jurisdiction: Kolkata, India.</li>
          </ul>
        </section>



        {/* -----------------------------------------------------
            USER RIGHTS
        ----------------------------------------------------- */}
        <h2 className="text-2xl font-bold mb-4">User Rights</h2>

        <section className="mb-6 text-gray-700">
          <ul className="list-disc list-inside">
            <li>Access personal data.</li>
            <li>Correct or update information.</li>
            <li>Delete account/data.</li>
            <li>Withdraw consent anytime.</li>
            <li>Object to processing.</li>
            <li>Request clarity on how data is used.</li>
            <li>Receive nondiscriminatory service.</li>
          </ul>
        </section>



        {/* -----------------------------------------------------
            REFUND POLICY
        ----------------------------------------------------- */}
        <h2 className="text-2xl font-bold mb-4">Refund Policy</h2>

        <section className="mb-6 text-gray-700">
          <ul className="list-disc list-inside">
            <li>HEKA does not charge patients directly.</li>
            <li>Commissions collected from partner hospitals/guest houses are non-refundable.</li>
            <li>Billing refunds related to treatment must be handled directly by the concerned hospital.</li>
            <li>Guest house cancellations/refunds follow respective guest house policies.</li>
            <li>If a user mistakenly pays HEKA, refunds (if eligible) are issued within 7–10 working days after verification.</li>
            <li>No refund is possible once service coordination is completed.</li>
            <li>Users will always be informed if a service involves third-party charges.</li>
          </ul>
        </section>



        {/* -----------------------------------------------------
            CONTACT
        ----------------------------------------------------- */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
          <p className="text-gray-700">
            Rudraksh Foundation <br />
            82/39 PGH Shah Road, Kolkata – 700032 <br />
            Email: info@rfheka.com <br />
            Phone: 6289924753 / 9883028878
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Privacy
