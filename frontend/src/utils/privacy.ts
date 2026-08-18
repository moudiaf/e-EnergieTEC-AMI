/**
 * AMI-STS System Utility: Privacy & Anonymization
 * Implements PII (Personally Identifiable Information) protection for Nigelec Compliance
 */

/**
 * Masks an email address: j.doe@example.com -> j***@ex*****.com
 */
export const maskEmail = (email: string | null | undefined): string => {
  if (!email) return 'N/A';
  const [name, domain] = email.split('@');
  if (!domain) return email;
  
  const maskedName = name.length > 2 
    ? `${name.substring(0, 1)}***` 
    : `${name}***`;
    
  const [domainName, tld] = domain.split('.');
  const maskedDomain = domainName.length > 2
    ? `${domainName.substring(0, 2)}****`
    : `${domainName}****`;
    
  return `${maskedName}@${maskedDomain}.${tld || 'com'}`;
};

/**
 * Masks a phone number: +227 90 12 34 56 -> +227 90 ** ** 56
 */
export const maskPhone = (phone: string | null | undefined): string => {
  if (!phone) return 'N/A';
  // Simplified masking for demo
  const clean = phone.replace(/\s/g, '');
  if (clean.length < 4) return phone;
  
  return `${phone.substring(0, phone.length - 4)}** **`;
};

/**
 * Formats a currency value for Niger (FCFA)
 */
export const formatFCFA = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};
