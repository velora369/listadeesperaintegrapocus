
export enum ProfessionalStatus {
  STUDENT = 'Estudante de Medicina',
  RESIDENT = 'Médico Residente',
  PRACTICING = 'Médico Atuante',
  PREPARING = 'Preparando para Residência',
  OTHER = 'Outro'
}

export interface Lead {
  id: string;
  timestamp: number;
  fullName: string;
  whatsapp: string;
  email: string;
  status: ProfessionalStatus | string;
  statusDetails?: string; // Other text
  universityName?: string;
  semester?: string;
  residencyProgram?: string;
  specialty?: string;
  referralSource?: string;
  tags?: string[];
}

export interface FormState extends Omit<Lead, 'id' | 'timestamp'> {}
