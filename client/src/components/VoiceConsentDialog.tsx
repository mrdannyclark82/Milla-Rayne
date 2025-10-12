import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface VoiceConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent: (granted: boolean) => void;
  consentType: 'voice_cloning' | 'voice_persona' | 'voice_synthesis';
}

const consentContent = {
  voice_cloning: {
    title: 'Voice Cloning Consent',
    description:
      'Voice cloning technology can create synthetic versions of human voices.',
    details: [
      'Your voice data will be used to create a personalized voice model',
      'Voice samples may be stored securely for training purposes',
      'You can revoke consent and request deletion of voice data at any time',
      'Voice cloning will only be used within this application',
      'Your voice data will never be shared with third parties without explicit permission',
    ],
    risks: [
      'Voice cloning technology could potentially be misused if security is compromised',
      'Synthetic voice may be similar to your natural voice',
      'Voice data storage requires secure infrastructure',
    ],
  },
  voice_persona: {
    title: 'Voice Persona Consent',
    description:
      'Voice personas allow customization of AI assistant voice characteristics.',
    details: [
      'You can select and customize different voice personas for the assistant',
      'Persona preferences are stored to provide consistent experience',
      'No actual voice cloning or recording of your voice occurs',
      'You can change or disable personas at any time',
    ],
    risks: [
      'Persona data preferences are stored locally',
      'Voice persona selection does not involve cloning your voice',
    ],
  },
  voice_synthesis: {
    title: 'Voice Synthesis Consent',
    description:
      'Text-to-speech synthesis enables the assistant to speak responses aloud.',
    details: [
      'The assistant will use text-to-speech to vocalize responses',
      'No recording or storage of your voice occurs',
      'You can disable voice synthesis at any time',
      'Voice synthesis uses browser-native or third-party TTS engines',
    ],
    risks: [
      'Voice synthesis does not involve recording or cloning',
      'Standard web speech APIs are used',
    ],
  },
};

export default function VoiceConsentDialog({
  open,
  onOpenChange,
  onConsent,
  consentType,
}: VoiceConsentDialogProps) {
  const [agreed, setAgreed] = useState(false);
  const content = consentContent[consentType];

  const handleGrant = () => {
    if (agreed) {
      onConsent(true);
      setAgreed(false);
    }
  };

  const handleDeny = () => {
    onConsent(false);
    setAgreed(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-900 text-white border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-6 h-6 text-blue-400" />
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-white/70 text-base">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* What This Means */}
          <div>
            <h3 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              What This Means
            </h3>
            <ul className="space-y-2 ml-6">
              {content.details.map((detail, index) => (
                <li key={index} className="text-sm text-white/80 list-disc">
                  {detail}
                </li>
              ))}
            </ul>
          </div>

          {/* Important Considerations */}
          <Alert className="bg-yellow-900/20 border-yellow-500/50">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-white/80 ml-2">
              <h4 className="font-semibold text-yellow-400 mb-2">
                Important Considerations
              </h4>
              <ul className="space-y-1 ml-4">
                {content.risks.map((risk, index) => (
                  <li key={index} className="text-sm list-disc">
                    {risk}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          {/* Consent Agreement */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
              />
              <span className="text-sm text-white/90">
                I have read and understood the above information. I consent to
                the use of{' '}
                <span className="font-semibold text-blue-400">
                  {consentType.replace('_', ' ')}
                </span>{' '}
                features as described. I understand I can revoke this consent at
                any time from the settings panel.
              </span>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleDeny}
            className="border-white/30 text-white/70 hover:text-white hover:bg-white/10"
          >
            Deny
          </Button>
          <Button
            onClick={handleGrant}
            disabled={!agreed}
            className={`${
              agreed
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Grant Consent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
