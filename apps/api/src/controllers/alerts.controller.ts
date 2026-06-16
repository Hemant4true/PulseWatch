import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendEmail, templates } from '../lib/mailer';

// Helper to get workspaceId
const getWorkspaceId = async (userId: string) => {
  const member = await prisma.workspaceMember.findFirst({ where: { userId } });
  return member?.workspaceId;
};

export const getPreferences = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const workspaceId = await getWorkspaceId(userId);
    if (!workspaceId) return res.status(403).json({ success: false, message: 'Forbidden' });

    let pref = await prisma.alertPreference.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });

    if (!pref) {
      pref = await prisma.alertPreference.create({
        data: { workspaceId, userId, emailEnabled: true, notifyOn: ['DOWN', 'UP', 'SSL_EXPIRING'] }
      });
    }

    res.json({ success: true, data: pref });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

import { z } from 'zod';

const UpdatePreferencesSchema = z.object({
  emailEnabled: z.boolean(),
  notifyOn: z.array(z.string())
});

export const updatePreferences = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const workspaceId = await getWorkspaceId(userId);
    if (!workspaceId) return res.status(403).json({ success: false, message: 'Forbidden' });

    const parsed = UpdatePreferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid inputs', errors: parsed.error.errors });
    }

    const { emailEnabled, notifyOn } = parsed.data;

    const pref = await prisma.alertPreference.upsert({
      where: { workspaceId_userId: { workspaceId, userId } },
      create: { workspaceId, userId, emailEnabled, notifyOn },
      update: { emailEnabled, notifyOn }
    });

    res.json({ success: true, data: pref });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const testAlert = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const email = req.user.email;
    
    await sendEmail(
      email, 
      '[TEST] PulseWatch Alert System', 
      `<div style="font-family: sans-serif; padding: 20px;">
        <h2>Test Email Successful!</h2>
        <p>Your PulseWatch alerting system is correctly configured.</p>
      </div>`
    );

    res.json({ success: true, message: 'Test email sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send test email' });
  }
};
