import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { Request } from 'express';
import { getConnection } from '../config/database';
import { User } from '../entities/User';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../config/logger';

const userRepository = () => getConnection().getRepository(User);

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ message: 'fullName, email et password sont requis' });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ message: 'Adresse email invalide' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }

    const repo = userRepository();
    const existing = await repo.findOneBy({ email });
    if (existing) {
      res.status(409).json({ message: 'Un compte existe déjà avec cet email' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = repo.create({
      fullName,
      email,
      password: hashedPassword,
      role: role || undefined,
    });
    await repo.save(user);

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

    res.status(201).json({
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Erreur lors de l'inscription:", error);
    res.status(500).json({ message: 'Impossible de créer le compte' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'email et password sont requis' });
      return;
    }

    const repo = userRepository();
    const user = await repo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Identifiants incorrects' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Identifiants incorrects' });
      return;
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

    res.status(200).json({
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Impossible de se connecter' });
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await userRepository().findOneBy({ id: req.user!.userId });
    if (!user) {
      res.status(404).json({ message: 'Utilisateur introuvable' });
      return;
    }
    res.status(200).json({ id: user.id, fullName: user.fullName, email: user.email, role: user.role });
  } catch (error) {
    logger.error("Erreur lors de la récupération du profil:", error);
    res.status(500).json({ message: 'Impossible de récupérer le profil' });
  }
};
