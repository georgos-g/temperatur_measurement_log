'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatGermanDate, formatGermanTime } from '@/lib/utils';
import { temperatureSchema, type TemperatureData } from '@/types/temperature';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Download, List, Thermometer, Upload } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { UserProfile } from './user-profile';

export function TemperatureForm() {
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<TemperatureData>({
    resolver: zodResolver(temperatureSchema),
  });

  // Set initial dateTime after mount to prevent hydration mismatch
  useEffect(() => {
    const now = new Date();
    setCurrentDateTime(now);
    setValue('date', formatGermanDate(now));
    setValue('time', formatGermanTime(now));
  }, [setValue]);

  // Update date and time every second
  useEffect(() => {
    if (!currentDateTime) return; // Don't start interval until initial time is set

    const interval = setInterval(() => {
      const now = new Date();
      setCurrentDateTime(now);
      setValue('date', formatGermanDate(now));
      setValue('time', formatGermanTime(now));
    }, 1000);

    return () => clearInterval(interval);
  }, [setValue, currentDateTime]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setValue('screenshot', file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: TemperatureData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('temperature', data.temperature.toString());
      formData.append('date', data.date);
      formData.append('time', data.time);

      if (data.screenshot) {
        formData.append('screenshot', data.screenshot);
      }

      const response = await fetch('/api/temperature', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save temperature data');
      }

      await response.json();

      // Reset form
      reset();
      setSelectedFile(null);
      setPreviewUrl(null);

      alert('Temperaturdaten erfolgreich gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern der Temperaturdaten:', error);
      alert(
        'Fehler beim Speichern der Temperaturdaten. Bitte versuchen Sie es erneut.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Get user name from localStorage for PDF
      const storedUser = localStorage.getItem('user');
      const userName = storedUser ? JSON.parse(storedUser).name : undefined;

      const url = userName
        ? `/api/pdf?userName=${encodeURIComponent(userName)}`
        : '/api/pdf';

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen der PDF');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `temperature-log-${
        new Date().toISOString().split('T')[0]
      }.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Fehler beim Herunterladen der PDF:', error);
      alert(
        'Fehler beim Herunterladen der PDF. Bitte versuchen Sie es erneut.'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className='container  mx-auto px-4 py-6 max-w-md'>
      <Card>
        <CardHeader className='text-center relative'>
          <UserProfile />
          <div className='absolute top-4 right-4'>
            <ThemeToggle />
          </div>
          <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <Thermometer className='h-6 w-6 text-primary' />
          </div>
          <CardTitle>Temperatur Logger</CardTitle>
          <CardDescription>
            Temperaturmessungen mit automatischem Zeitstempel aufzeichnen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* Temperature Input */}
            <div className='space-y-2'>
              <label htmlFor='temperature' className='text-sm font-medium'>
                Temperatur (°C)
              </label>
              <Input
                id='temperature'
                type='number'
                step='0.1'
                placeholder='Temperatur eingeben'
                {...register('temperature', { valueAsNumber: true })}
                className='text-center text-lg'
              />
              {errors.temperature && (
                <p className='text-sm text-destructive'>
                  {errors.temperature.message}
                </p>
              )}
            </div>

            {/* Location Select */}
            <div className='space-y-2'>
              <label htmlFor='location' className='text-sm font-medium'>
                Standort
              </label>
              <Select
                id='location'
                {...register('location')}
                defaultValue='Küche'
              >
                <option value='Küche'>Küche</option>
                <option value='Gäste WC'>Gäste WC</option>
                <option value='Bad Waschbecken'>Bad Waschbecken</option>
                <option value='Bad-Badewanne/Dusche'>
                  Bad Badewanne/Dusche
                </option>
              </Select>
              {errors.location && (
                <p className='text-sm text-destructive'>
                  {errors.location.message}
                </p>
              )}
            </div>

            <div className='flex justify-between gap-2'>
              {/* Date Display */}
              <div className='space-y-2 w-full'>
                <label className='text-sm font-medium'>Datum</label>
                <div className='rounded-md border bg-muted px-3 py-2 text-sm'>
                  {currentDateTime
                    ? formatGermanDate(currentDateTime)
                    : '--.--.----'}
                </div>
              </div>

              {/* Time Display */}
              <div className='space-y-2 w-full'>
                <label className='text-sm font-medium'>Uhrzeit</label>
                <div className='rounded-md border bg-muted px-3 py-2 text-sm font-mono'>
                  {currentDateTime
                    ? formatGermanTime(currentDateTime)
                    : '--:--:--'}
                </div>
              </div>
            </div>

            {/* Screenshot Upload */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                Screenshot (Optional)
              </label>
              <div className='space-y-3'>
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleFileChange}
                  className='hidden'
                  id='screenshot'
                />
                <label htmlFor='screenshot'>
                  <div className='flex items-center justify-center w-full h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors'>
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt='Preview'
                        className='h-full w-full object-cover rounded-lg'
                      />
                    ) : (
                      <div className='flex flex-col items-center text-muted-foreground'>
                        <Camera className='h-8 w-8 mb-2' />
                        <span className='text-sm'>Screenshot hinzufügen</span>
                      </div>
                    )}
                  </div>
                </label>
                {selectedFile && (
                  <p className='text-xs text-muted-foreground text-center'>
                    {selectedFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type='submit'
              className='w-full'
              disabled={isSubmitting}
              size='lg'
            >
              {isSubmitting ? (
                <>
                  <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                  Speichere...
                </>
              ) : (
                <>
                  <Upload className='mr-2 h-4 w-4' />
                  Temperatur speichern
                </>
              )}
            </Button>

            {/* Action Buttons */}
            <div className='grid grid-cols-2 gap-3'>
              <Button
                type='button'
                variant='outline'
                onClick={downloadPDF}
                disabled={isDownloading}
                size='lg'
              >
                {isDownloading ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                    PDF wird erstellt...
                  </>
                ) : (
                  <>
                    <Download className='mr-2 h-4 w-4' />
                    PDF Bericht
                  </>
                )}
              </Button>

              <Link href='/results' className='w-full'>
                <Button
                  type='button'
                  variant='outline'
                  className='w-full'
                  size='lg'
                >
                  <List className='mr-2 h-4 w-4' />
                  Ergebnisse anzeigen
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
