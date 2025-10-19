'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Mail, Download, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-adapter';

interface ActionsBarProps {
  selectedItineraryId?: string;
}

export function ActionsBar({ selectedItineraryId }: ActionsBarProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleFinalizeToCalendar = async () => {
    if (!selectedItineraryId) return;
    setLoading('calendar');
    try {
      const icsData = await api.exportToICS(selectedItineraryId);
      const blob = new Blob([icsData], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'itinerary.ics';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error finalizing to calendar:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleEmailPlan = async () => {
    if (!selectedItineraryId) return;
    setLoading('email');
    try {
      const email = prompt('Enter your email address:');
      if (email) {
        await api.sendEmail(selectedItineraryId, email);
        alert('Email sent successfully!');
      }
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedItineraryId) return;
    setLoading('pdf');
    try {
      const blob = await api.exportToPDF(selectedItineraryId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'itinerary.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setLoading(null);
    }
  };

  const disabled = !selectedItineraryId;

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleFinalizeToCalendar}
        disabled={disabled || loading === 'calendar'}
        className="gap-2"
      >
        {loading === 'calendar' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Calendar className="h-4 w-4" />
        )}
        Finalize to Calendar
      </Button>
      <Button
        onClick={handleEmailPlan}
        disabled={disabled || loading === 'email'}
        variant="outline"
        className="gap-2"
      >
        {loading === 'email' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        Email Plan
      </Button>
      <Button
        onClick={handleExportPDF}
        disabled={disabled || loading === 'pdf'}
        variant="outline"
        className="gap-2"
      >
        {loading === 'pdf' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Export PDF
      </Button>
    </div>
  );
}

