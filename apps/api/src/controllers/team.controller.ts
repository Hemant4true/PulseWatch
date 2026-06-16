import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import { getInviteTemplate, sendEmail } from '../lib/mailer';
import { WorkspaceRole } from '@prisma/client';

export const getMembers = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const workspaceId = req.member.workspaceId;

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } }
      },
      orderBy: { joinedAt: 'asc' }
    });

    const invites = await prisma.workspaceInvite.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: { members, invites } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching team data' });
  }
};

import { z } from 'zod';

const InviteMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.nativeEnum(WorkspaceRole).optional()
});

export const inviteMember = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const workspaceId = req.member.workspaceId;
    // @ts-ignore
    const inviterId = req.user.id;
    
    const parsed = InviteMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid inputs', errors: parsed.error.errors });
    }
    
    const { email, role } = parsed.data;

    // Check if already a member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: existingUser.id } }
      });
      if (existingMember) return res.status(400).json({ success: false, message: 'User is already a member' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Upsert the invite
    await prisma.workspaceInvite.upsert({
      where: { workspaceId_email: { workspaceId, email } },
      update: { tokenHash, role: role || 'MEMBER', expiresAt, inviterId },
      create: { workspaceId, email, tokenHash, role: role || 'MEMBER', expiresAt, inviterId }
    });

    // Fetch workspace and inviter details for email
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    const inviter = await prisma.user.findUnique({ where: { id: inviterId } });

    const acceptLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${token}`;
    const html = getInviteTemplate(inviter?.name || 'A team member', workspace?.name || 'Workspace', acceptLink);
    
    await sendEmail(email, `You're invited to join ${workspace?.name || 'a workspace'} on PulseWatch`, html);

    res.json({ success: true, message: 'Invite sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error sending invite' });
  }
};

export const revokeInvite = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const workspaceId = req.member.workspaceId;
    const { id } = req.params;

    await prisma.workspaceInvite.deleteMany({
      where: { id, workspaceId }
    });

    res.json({ success: true, message: 'Invite revoked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error revoking invite' });
  }
};

const UpdateRoleSchema = z.object({
  role: z.nativeEnum(WorkspaceRole)
});

export const updateRole = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const workspaceId = req.member.workspaceId;
    const { id } = req.params; // workspaceMember id
    
    const parsed = UpdateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid inputs', errors: parsed.error.errors });
    }
    const { role } = parsed.data;

    const memberToUpdate = await prisma.workspaceMember.findFirst({
      where: { id, workspaceId }
    });

    if (!memberToUpdate) return res.status(404).json({ success: false, message: 'Member not found' });

    // Protect OWNER demotion
    if (memberToUpdate.role === 'OWNER' && role !== 'OWNER') {
      const ownersCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: 'OWNER' }
      });
      if (ownersCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot demote the last OWNER' });
      }
    }

    await prisma.workspaceMember.update({
      where: { id },
      data: { role }
    });

    res.json({ success: true, message: 'Role updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating role' });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const workspaceId = req.member.workspaceId;
    const { id } = req.params;

    const memberToRemove = await prisma.workspaceMember.findFirst({
      where: { id, workspaceId }
    });

    if (!memberToRemove) return res.status(404).json({ success: false, message: 'Member not found' });

    // Protect OWNER removal
    if (memberToRemove.role === 'OWNER') {
      const ownersCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: 'OWNER' }
      });
      if (ownersCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot remove the last OWNER' });
      }
    }

    await prisma.workspaceMember.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error removing member' });
  }
};

const AcceptInviteSchema = z.object({
  token: z.string().min(1, 'Token is required')
});

export const acceptInvite = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    
    const parsed = AcceptInviteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid inputs', errors: parsed.error.errors });
    }
    const { token } = parsed.data;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invite = await prisma.workspaceInvite.findUnique({
      where: { tokenHash }
    });

    if (!invite) return res.status(400).json({ success: false, message: 'Invalid invite link' });
    if (invite.expiresAt < new Date()) return res.status(400).json({ success: false, message: 'Invite has expired' });

    // Make sure user matches invite email (optional strictness, but good for security)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email !== invite.email) {
      return res.status(400).json({ success: false, message: 'This invite was sent to a different email address' });
    }

    // Add to workspace
    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId } },
      create: { workspaceId: invite.workspaceId, userId, role: invite.role },
      update: { role: invite.role }
    });

    // Delete invite (one-time use)
    await prisma.workspaceInvite.delete({ where: { id: invite.id } });

    res.json({ success: true, message: 'Invite accepted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error accepting invite' });
  }
};
