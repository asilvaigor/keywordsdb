import type { Metadata } from "next";
import Footer from "@/components/footer";
import Header from "@/components/header";

const title = "KeywordsDB Terms of Service - Legal Agreement";
const description =
  "Read our comprehensive Terms of Service to understand the rules, guidelines and responsabilities governing the use of KeywordsDB.";

export const metadata: Metadata = {
  title: title,
  description: description,
  metadataBase: "https://keywordsdb.com",
  alternates: { canonical: "/tos" },
  openGraph: {
    title: title,
    description: description,
    type: "website",
    url: "/tos",
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

export default function TOS() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container max-w-3xl text-justify mx-auto px-4 py-8">
        <h1 className="mb-4 text-3xl font-bold">
          Website Terms and Conditions of Use
        </h1>

        <h2 className="mb-3 mt-6 text-xl font-semibold">1. Terms</h2>
        <p className="mb-4">
          By accessing this Website, accessible from keywordsdb.com, you are
          agreeing to be bound by these Website Terms and Conditions of Use and
          agree that you are responsible for the agreement with any applicable
          local laws. If you disagree with any of these terms, you are
          prohibited from accessing this site. The materials contained in this
          Website are protected by copyright and trade mark law.
        </p>

        <h2 className="mb-3 mt-6 text-xl font-semibold">2. Use License</h2>
        <p className="mb-4">
          Permission is granted to temporarily download one copy of the
          materials on KeywordsDB&apos;s Website for personal or commercial use.
          You are free to:
        </p>
        <ul className="mb-4 list-disc pl-6">
          <li>modify or copy the materials;</li>
          <li>
            use the materials for any commercial purpose or for any public
            display;
          </li>
          <li>
            transferring the materials to another person or &quot;mirror&quot;
            the materials on any other server.
          </li>
        </ul>

        <p className="mb-4">You may not:</p>
        <ul className="mb-4 list-disc pl-6">
          <li>
            attempt to reverse engineer any software contained on
            KeywordsDB&apos;s Website;
          </li>
          <li>
            remove any copyright or other proprietary notations from the
            materials;
          </li>
        </ul>

        <p className="mb-4">
          This will let KeywordsDB to terminate upon violations of any of these
          restrictions. Upon termination, your viewing right will also be
          terminated and you should destroy any downloaded materials in your
          possession whether it is printed or electronic format.
        </p>

        <h2 className="mb-3 mt-6 text-xl font-semibold">3. Disclaimer</h2>
        <p className="mb-4">
          All the materials on KeywordsDB&apos;s Website are provided &quot;as
          is&quot;. KeywordsDB makes no warranties, may it be expressed or
          implied, therefore negates all other warranties. Furthermore,
          KeywordsDB does not make any representations concerning the accuracy
          or reliability of the use of the materials on its Website or otherwise
          relating to such materials or any sites linked to this Website.
        </p>

        <h2 className="mb-3 mt-6 text-xl font-semibold">4. Limitations</h2>
        <p className="mb-4">
          KeywordsDB or its suppliers will not be hold accountable for any
          damages that will arise with the use or inability to use the materials
          on KeywordsDB&apos;s Website, even if KeywordsDB or an authorize
          representative of this Website has been notified, orally or written,
          of the possibility of such damage. Some jurisdiction does not allow
          limitations on implied warranties or limitations of liability for
          incidental damages, these limitations may not apply to you.
        </p>

        <h2 className="mb-3 mt-6 text-xl font-semibold">
          5. Revisions and Errata
        </h2>
        <p className="mb-4">
          The materials appearing on KeywordsDB&apos;s Website may include
          technical, typographical, or photographic errors. KeywordsDB will not
          promise that any of the materials in this Website are accurate,
          complete, or current. KeywordsDB may change the materials contained on
          its Website at any time without notice. KeywordsDB does not make any
          commitment to update the materials.
        </p>

        <h2 className="mb-3 mt-6 text-xl font-semibold">6. Links</h2>
        <p className="mb-4">
          KeywordsDB has not reviewed all of the sites linked to its Website and
          is not responsible for the contents of any such linked site. The
          presence of any link does not imply endorsement by KeywordsDB of the
          site. The use of any linked website is at the user&apos;s own risk.
        </p>

        <h2 className="mb-3 mt-6 text-xl font-semibold">
          7. Site Terms of Use Modifications
        </h2>
        <p className="mb-4">
          KeywordsDB may revise these Terms of Use for its Website at any time
          without prior notice. By using this Website, you are agreeing to be
          bound by the current version of these Terms and Conditions of Use.
        </p>

        <h2 className="mb-3 mt-6 text-xl font-semibold">8. Your Privacy</h2>
        <p className="mb-4">Please read our Privacy Policy.</p>

        <h2 className="mb-3 mt-6 text-xl font-semibold">9. Governing Law</h2>
        <p className="mb-4">
          Any claim related to KeywordsDB&apos;s Website shall be governed by
          the laws of fr without regards to its conflict of law provisions.
        </p>
      </main>
      <Footer />
    </div>
  );
}
