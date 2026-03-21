import type { Metadata } from "next";
import Footer from "@/components/footer";
import Header from "@/components/header";

const title = "Privacy | KeywordsDB";
const description =
  "Learn about our commitment to protecting your privacy and how we handle your personal information at KeywordsDB.";

export const metadata: Metadata = {
  title: title,
  description: description,
  metadataBase: "https://keywordsdb.com",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: title,
    description: description,
    type: "website",
    url: "/privacy",
    locale: "en_US",
    siteName: "KeywordsDB",
    images: {
      url: "/og-image.png",
      width: 2115,
      height: 1189,
      alt: title,
    },
  },
};

export default function Privacy() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container max-w-3xl text-justify mx-auto px-4 py-8">
        <h1 className="mb-4 text-3xl font-bold">Privacy Policy</h1>
        <p className="mb-4">
          At KeywordsDB, accessible from keywordsdb.com, one of our main
          priorities is the privacy of our visitors. This Privacy Policy
          document contains types of information that is collected and recorded
          by KeywordsDB and how we use it.
        </p>
        <p className="mb-4">
          If you have additional questions or require more information about our
          Privacy Policy, do not hesitate to contact us.
        </p>
        <p className="mb-4">
          This Privacy Policy applies only to our online activities and is valid
          for visitors to our website with regards to the information that they
          shared and/or collect in KeywordsDB. This policy is not applicable to
          any information collected offline or via channels other than this
          website.
        </p>

        <h3 className="mb-3 mt-6 text-xl font-semibold">Consent</h3>
        <p className="mb-4">
          By using our website, you hereby consent to our Privacy Policy and
          agree to its terms.
        </p>

        <h3 className="mb-3 mt-6 text-xl font-semibold">
          Information we collect
        </h3>
        <p className="mb-4">
          The personal information that you are asked to provide, and the
          reasons why you are asked to provide it, will be made clear to you at
          the point we ask you to provide your personal information.
        </p>
        <p className="mb-4">
          If you contact us directly, we may receive additional information
          about you such as your name, email address, phone number, the contents
          of the message and/or attachments you may send us, and any other
          information you may choose to provide.
        </p>

        <h4 className="mb-2 mt-4 text-lg font-semibold">Personal Data</h4>
        <p className="mb-4">
          While using Our Service, We may ask You to provide Us with certain
          personally identifiable information that can be used to contact or
          identify You. Personally identifiable information may include, but is
          not limited to:
        </p>
        <ul className="mb-4 list-disc pl-6">
          <li>Email address</li>
          <li>Usage Data</li>
        </ul>

        <h4 className="mb-2 mt-4 text-lg font-semibold">Usage Data</h4>
        <p className="mb-4">
          Usage Data is collected automatically when using the Service.
        </p>
        <p className="mb-4">
          Usage Data may include information such as Your Device&apos;s Internet
          Protocol address (e.g. IP address), browser type, browser version, the
          pages of our Service that You visit, the time and date of Your visit,
          the time spent on those pages, unique device identifiers and other
          diagnostic data.
        </p>
        <p className="mb-4">
          When You access the Service by or through a mobile device, We may
          collect certain information automatically, including, but not limited
          to, the type of mobile device You use, Your mobile device unique ID,
          the IP address of Your mobile device, Your mobile operating system,
          the type of mobile Internet browser You use, unique device identifiers
          and other diagnostic data.
        </p>
        <p className="mb-4">
          We may also collect information that Your browser sends whenever You
          visit our Service or when You access the Service by or through a
          mobile device.
        </p>

        <h4 className="mb-2 mt-4 text-lg font-semibold">
          Tracking Technologies and Cookies
        </h4>
        <p className="mb-4">
          We use Cookies and similar tracking technologies to track the activity
          on Our Service and store certain information. Tracking technologies
          used are beacons, tags, and scripts to collect and track information
          and to improve and analyze Our Service. The technologies We use may
          include:
        </p>
        <ul className="mb-4 list-disc pl-6">
          <li className="mb-2">
            <strong>Cookies or Browser Cookies.</strong> A cookie is a small
            file placed on Your Device. You can instruct Your browser to refuse
            all Cookies or to indicate when a Cookie is being sent. However, if
            You do not accept Cookies, You may not be able to use some parts of
            our Service. Unless you have adjusted Your browser setting so that
            it will refuse Cookies, our Service may use Cookies.
          </li>
          <li>
            <strong>Web Beacons.</strong> Certain sections of our Service and
            our emails may contain small electronic files known as web beacons
            (also referred to as clear gifs, pixel tags, and single-pixel gifs)
            that permit the Company, for example, to count users who have
            visited those pages or opened an email and for other related website
            statistics (for example, recording the popularity of a certain
            section and verifying system and server integrity).
          </li>
        </ul>
        <p className="mb-4">
          We use both Session and Persistent Cookies for the purposes set out
          below:
        </p>
        <ul className="mb-4 list-disc pl-6">
          <li className="mb-3">
            <strong>Necessary / Essential Cookies</strong>
            <p>Type: Session Cookies</p>
            <p>Administered by: Us</p>
            <p>
              Purpose: These Cookies are essential to provide You with services
              available through the Website and to enable You to use some of its
              features. They help to authenticate users and prevent fraudulent
              use of user accounts. Without these Cookies, the services that You
              have asked for cannot be provided, and We only use these Cookies
              to provide You with those services.
            </p>
          </li>
          <li className="mb-3">
            <strong>Cookies Policy / Notice Acceptance Cookies</strong>
            <p>Type: Persistent Cookies</p>
            <p>Administered by: Us</p>
            <p>
              Purpose: These Cookies identify if users have accepted the use of
              cookies on the Website.
            </p>
          </li>
          <li>
            <strong>Functionality Cookies</strong>
            <p>Type: Persistent Cookies</p>
            <p>Administered by: Us</p>
            <p>
              Purpose: These Cookies allow us to remember choices You make when
              You use the Website, such as remembering your login details or
              language preference. The purpose of these Cookies is to provide
              You with a more personal experience and to avoid You having to
              re-enter your preferences every time You use the Website.
            </p>
          </li>
        </ul>

        <h3 className="mb-3 mt-6 text-xl font-semibold">
          Retention of Your Personal Data
        </h3>
        <p className="mb-4">
          The Company will retain Your Personal Data only for as long as is
          necessary for the purposes set out in this Privacy Policy. We will
          retain and use Your Personal Data to the extent necessary to comply
          with our legal obligations (for example, if we are required to retain
          your data to comply with applicable laws), resolve disputes, and
          enforce our legal agreements and policies.
        </p>
        <p className="mb-4">
          The Company will also retain Usage Data for internal analysis
          purposes. Usage Data is generally retained for a shorter period of
          time, except when this data is used to strengthen the security or to
          improve the functionality of Our Service, or We are legally obligated
          to retain this data for longer time periods.
        </p>

        <h3 className="mb-3 mt-6 text-xl font-semibold">
          How we use your information
        </h3>
        <p className="mb-4">
          We use the information we collect in various ways, including to:
        </p>
        <ul className="mb-4 list-disc pl-6">
          <li>Provide, operate, and maintain our website</li>
          <li>Improve, personalize, and expand our website</li>
          <li>Understand and analyze how you use our website</li>
          <li>Develop new products, services, features, and functionality</li>
          <li>
            Communicate with you, either directly or through one of our
            partners, including for customer service, to provide you with
            updates and other information relating to the website, and for
            marketing and promotional purposes
          </li>
          <li>Send you emails</li>
          <li>Find and prevent fraud</li>
        </ul>

        <h3 className="mb-3 mt-6 text-xl font-semibold">
          CCPA Privacy Rights (Do Not Sell My Personal Information)
        </h3>
        <p className="mb-4">
          Under the CCPA, among other rights, California consumers have the
          right to:
        </p>
        <p className="mb-4">
          Request that a business that collects a consumer&apos;s personal data
          disclose the categories and specific pieces of personal data that a
          business has collected about consumers.
        </p>
        <p className="mb-4">
          Request that a business delete any personal data about the consumer
          that a business has collected.
        </p>
        <p className="mb-4">
          Request that a business that sells a consumer&apos;s personal data,
          not sell the consumer&apos;s personal data.
        </p>
        <p className="mb-4">
          If you make a request, we have one month to respond to you. If you
          would like to exercise any of these rights, please contact us.
        </p>

        <h3 className="mb-3 mt-6 text-xl font-semibold">
          GDPR Data Protection Rights
        </h3>
        <p className="mb-4">
          We would like to make sure you are fully aware of all of your data
          protection rights. Every user is entitled to the following:
        </p>
        <p className="mb-4">
          The right to access - You have the right to request copies of your
          personal data. We may charge you a small fee for this service.
        </p>
        <p className="mb-4">
          The right to rectification - You have the right to request that we
          correct any information you believe is inaccurate. You also have the
          right to request that we complete the information you believe is
          incomplete.
        </p>
        <p className="mb-4">
          The right to erasure - You have the right to request that we erase
          your personal data, under certain conditions.
        </p>
        <p className="mb-4">
          The right to restrict processing - You have the right to request that
          we restrict the processing of your personal data, under certain
          conditions.
        </p>
        <p className="mb-4">
          The right to object to processing - You have the right to object to
          our processing of your personal data, under certain conditions.
        </p>
        <p className="mb-4">
          The right to data portability - You have the right to request that we
          transfer the data that we have collected to another organization, or
          directly to you, under certain conditions.
        </p>
        <p className="mb-4">
          If you make a request, we have one month to respond to you. If you
          would like to exercise any of these rights, please contact us.
        </p>

        <h3 className="mb-3 mt-6 text-xl font-semibold">
          Transfer of Your Personal Data
        </h3>
        <p className="mb-4">
          Your information, including Personal Data, is processed at the
          Company&apos;s operating offices and in any other places where the
          parties involved in the processing are located. It means that this
          information may be transferred to — and maintained on — computers
          located outside of Your state, province, country or other governmental
          jurisdiction where the data protection laws may differ than those from
          Your jurisdiction.
        </p>
        <p className="mb-4">
          Your consent to this Privacy Policy followed by Your submission of
          such information represents Your agreement to that transfer.
        </p>
        <p className="mb-4">
          The Company will take all steps reasonably necessary to ensure that
          Your data is treated securely and in accordance with this Privacy
          Policy and no transfer of Your Personal Data will take place to an
          organization or a country unless there are adequate controls in place
          including the security of Your data and other personal information.
        </p>

        <h3 className="mb-3 mt-6 text-xl font-semibold">
          Delete Your Personal Data
        </h3>
        <p className="mb-4">
          You have the right to delete or request that We assist in deleting the
          Personal Data that We have collected about You.
        </p>
        <p className="mb-4">
          Our Service may give You the ability to delete certain information
          about You from within the Service.
        </p>
        <p className="mb-4">
          You may update, amend, or delete Your information at any time by
          signing in to Your Account, if you have one, and visiting the account
          settings section that allows you to manage Your personal information.
          You may also contact Us to request access to, correct, or delete any
          personal information that You have provided to Us.
        </p>
        <p className="mb-4">
          Please note, however, that We may need to retain certain information
          when we have a legal obligation or lawful basis to do so.
        </p>

        <h3 className="mb-3 mt-6 text-xl font-semibold">
          Children&apos;s Information
        </h3>
        <p className="mb-4">
          Another part of our priority is adding protection for children while
          using the internet. We encourage parents and guardians to observe,
          participate in, and/or monitor and guide their online activity.
        </p>
        <p className="mb-4">
          KeywordsDB does not knowingly collect any Personal Identifiable
          Information from children under the age of 13. If you think that your
          child provided this kind of information on our website, we strongly
          encourage you to contact us immediately and we will do our best
          efforts to promptly remove such information from our records.
        </p>

        <h3 className="mb-3 mt-6 text-xl font-semibold">
          Changes to This Privacy Policy
        </h3>
        <p className="mb-4">
          We may update our Privacy Policy from time to time. Thus, we advise
          you to review this page periodically for any changes. We will notify
          you of any changes by posting the new Privacy Policy on this page.
          These changes are effective immediately, after they are posted on this
          page.
        </p>

        <h3 className="mb-3 mt-6 text-xl font-semibold">Contact Us</h3>
        <p className="mb-4">
          If you have any questions or suggestions about our Privacy Policy, do
          not hesitate to contact us at support@keywordsdb.com.
        </p>
      </main>
      <Footer />
    </div>
  );
}
