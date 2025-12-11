import { PROJECT_TITLE } from "~/lib/constants";

export async function GET() {
  const appUrl =
    process.env.NEXT_PUBLIC_URL ||
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjk5MTAsInR5cGUiOiJhdXRoIiwia2V5IjoiMHg1NjZFMzMwYjZlQTc0NDNDZGU1NDkyNzQ0ODUxNTA3Mjk1YTNBMThlIn0",
      payload: "eyJkb21haW4iOiJsZXZlcnR6LWZhcnN0cmVhay52ZXJjZWwuYXBwIn0",
      signature: "RvL8M3yFTGQ+edIiP3lwu+TITZt2zr2avW422B+u7YIis3g7KYG11aM1yn34NNuLFFIohZP84BcgRnErkMeLcBw="
    },
    miniapp: {
      version: "1",
      name: PROJECT_TITLE,
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/frames/hello/opengraph-image`,
      ogImageUrl: `${appUrl}/frames/hello/opengraph-image`,
      buttonTitle: "Open",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
      webhookUrl: `${appUrl}/api/webhook`,
      primaryCategory: "social",
    },
  };

  return Response.json(config);
}
