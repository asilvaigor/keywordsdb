export async function html({ url }: { url: string }) {
  return `
<body style="background: #f9f9f9; padding: 20px;">
  <table
    width="100%"
    border="0"
    cellspacing="20"
    cellpadding="0"
    style="
      background: #fff;
      max-width: 600px;
      margin: auto;
      border-radius: 10px;
    "
  >
    <tr>
      <td align="center">
        <img
          width="48"
          height="48"
          src="https://keywordsdb.com/apple-icon.png"
        />
      </td>
    </tr>
    <tr>
      <td
        align="center"
        style="
          font-size: 24px;
          font-family: Helvetica, Arial, sans-serif;
          color: #000;
        "
      >
        Sign in to <strong>KeywordsDB</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <a
                href="${url}"
                target="_blank"
                style="
                  display: block;
                  font-size: 18px;
                  font-family: Helvetica, Arial, sans-serif;
                  color: #0c1310;
                  text-decoration: none;
                  border-radius: 8px;
                  line-height: 48px;
                  width: 300px;
                  background-color: #fcc800;
                "
                >Sign in</a
              >
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td
        align="center"
        style="
          padding: 0px 0px 10px 0px;
          font-size: 16px;
          line-height: 22px;
          font-family: Helvetica, Arial, sans-serif;
          color: #5e5f67;
        "
      >
        If you did not request this email you can safely ignore it.
      </td>
    </tr>
  </table>
</body>
`;
}
