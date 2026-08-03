import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export const resend = {
  emails: {
    send: async (options: any) => {
      try {
        return await getResend().emails.send(options);
      } catch (error) {
        console.error("Failed to send email:", error);
        throw error;
      }
    },
  },
};
