'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatGermanDate, formatGermanTime } from '@/lib/utils';
import { temperatureSchema, type TemperatureData } from '@/types/temperature';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Download, List, Thermometer, Upload } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { TemperatureChart } from './temperature-chart';
import { UserProfile } from './user-profile';

// Native HTML5 Canvas Image Compression
async function compressImageClient(file: File): Promise<File> {
  const MAX_DIMENSION = 1200;
  const targetSizeKB = 300;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.8;
        const compress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              if (blob.size / 1024 <= targetSizeKB || quality <= 0.1) {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
              } else {
                quality -= 0.1;
                compress();
              }
            },
            'image/jpeg',
            quality,
          );
        };
        compress();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function TemperatureForm() {
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [chartData, setChartData] = useState<
    { created_at: string; temperature: number }[]
  >([]);

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

  // Fetch historical data for chart
  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch('/api/temperature');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.records) {
            // Filter to last 90 days (3 months)
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            // Map the data to what the chart expects
            // Combine German date (DD.MM.YYYY) and time -> ISO string for accurate sorting
            const mappedData = result.records
              .map((r: { date: string; time: string; temperature: number }) => {
                const [day, month, year] = r.date.split('.');
                const dateObj = new Date(`${year}-${month}-${day}T${r.time}`);
                return {
                  created_at: dateObj.toISOString(),
                  temperature: r.temperature,
                };
              })
              .filter(
                (r: { created_at: string; temperature: number }) =>
                  new Date(r.created_at) >= ninetyDaysAgo,
              );

            setChartData(mappedData);
          }
        }
      } catch (e) {
        console.error('Failed to fetch chart data:', e);
      }
    }
    fetchHistory();
  }, []);

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
      formData.append('location', data.location);

      // Compress image before uploading
      if (data.screenshot) {
        console.log(
          `Original image size: ${(data.screenshot.size / 1024).toFixed(2)}KB`,
        );
        const compressedFile = await compressImageClient(data.screenshot);
        console.log(
          `Compressed image size: ${(compressedFile.size / 1024).toFixed(2)}KB`,
        );
        formData.append('screenshot', compressedFile);
      }

      const response = await fetch('/api/temperature', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to save temperature data');
      }

      await response.json();

      // Reset form
      reset();
      setPreviewUrl(null);

      alert('Temperaturdaten erfolgreich gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern der Temperaturdaten:', error);
      alert(
        'Fehler beim Speichern der Temperaturdaten. Bitte versuchen Sie es erneut.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadPDF = async (range: string) => {
    setIsDownloading(true);
    try {
      // Get user name from localStorage
      const storedUser = localStorage.getItem('user');
      const userName = storedUser ? JSON.parse(storedUser).name : undefined;

      let queryParams = userName
        ? `?userName=${encodeURIComponent(userName)}`
        : '?';

      if (range !== 'all') {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - parseInt(range));

        queryParams += `${
          queryParams === '?' ? '' : '&'
        }startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      }

      const url = `/api/pdf${queryParams === '?' ? '' : queryParams}`;

      // 1. Fetch the PDF as a binary blob
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/pdf',
        },
      });

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen der PDF');
      }

      const blob = await response.blob();

      // 2. Convert Blob to Base64 to bypass browser UUID naming bugs
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = () => {
        const base64data = reader.result as string;

        // 3. Trigger robust cross-browser download
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = base64data;
        link.download = `temperature-log-${new Date().toISOString().split('T')[0]}.pdf`;

        document.body.appendChild(link);
        link.click();

        // Cleanup immediately since it's a data URI
        document.body.removeChild(link);
        setIsDownloading(false);
      };

      reader.onerror = () => {
        setIsDownloading(false);
        throw new Error('Fehler beim Verarbeiten der PDF');
      };
    } catch (error) {
      console.error('Fehler beim Herunterladen der PDF:', error);
      alert(
        'Fehler beim Herunterladen der PDF. Bitte versuchen Sie es erneut.',
      );
      setIsDownloading(false);
    }
  };

  return (
    <div className='container mx-auto px-4 py-6 max-w-md relative'>
      {/* Decorative gradient orbs */}
      <div className='gradient-orb-1' />
      <div className='gradient-orb-2' />

      <Card className='glass-card card-elevated border-white/20 bg-white/70 backdrop-blur-xl dark:bg-black/50'>
        <CardHeader className='pb-0 pt-4 px-4 flex flex-row items-center justify-between'>
          <UserProfile />
          <ThemeToggle />
        </CardHeader>

        <CardContent className='pt-2 px-4 space-y-4'>
          {chartData.length > 0 && (
            <div className='mb-2'>
              <div className='flex items-center gap-2 mb-1'>
                <Thermometer className='h-4 w-4 text-primary' />
                <span className='text-sm font-semibold'>3-Monate Verlauf</span>
              </div>
              <TemperatureChart data={chartData} />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            {/* Location & Temp Grid */}
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <label className='text-xs font-medium text-muted-foreground'>
                  Standort
                </label>
                <Select
                  id='location'
                  {...register('location')}
                  defaultValue='Küche'
                  className='h-10'
                >
                  <option value='Küche'>Küche</option>
                  <option value='Gäste WC'>Gäste WC</option>
                  <option value='Bad Waschbecken'>Bad Waschbecken</option>
                  <option value='Bad-Badewanne/Dusche'>Bad BW/Dusche</option>
                </Select>
                {errors.location && (
                  <p className='text-xs text-destructive'>
                    {errors.location.message}
                  </p>
                )}
              </div>
              <div className='space-y-1'>
                <label className='text-xs font-medium text-muted-foreground'>
                  Temperatur (°C)
                </label>
                <Input
                  id='temperature'
                  type='number'
                  step='0.1'
                  placeholder='0.0'
                  {...register('temperature', { valueAsNumber: true })}
                  className='text-center text-lg h-10 font-bold'
                />
                {errors.temperature && (
                  <p className='text-xs text-destructive'>
                    {errors.temperature.message}
                  </p>
                )}
              </div>
            </div>
            {/* Date/Time subtle text */}
            <div className='flex justify-between items-center text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-md'>
              <span>
                {currentDateTime
                  ? formatGermanDate(currentDateTime)
                  : '--.--.----'}
              </span>
              <span className='font-mono'>
                {currentDateTime
                  ? formatGermanTime(currentDateTime)
                  : '--:--:--'}
              </span>
            </div>

            {/* Actions: Save + Screenshot Grid */}
            <div className='grid grid-cols-2 gap-3'>
              <div className='relative'>
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleFileChange}
                  className='hidden'
                  id='screenshot'
                />
                <label htmlFor='screenshot' className='block h-full'>
                  <div
                    className={`flex items-center justify-center w-full h-12 border border-input bg-background rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm text-sm font-medium ${previewUrl ? 'border-primary' : ''}`}
                  >
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt='Preview'
                        className='h-full w-full object-cover rounded-md opacity-50'
                      />
                    ) : (
                      <>
                        <Camera className='mr-2 h-4 w-4 text-muted-foreground' />
                        Screenshot
                      </>
                    )}
                  </div>
                </label>
              </div>

              <Button
                type='submit'
                className='w-full h-12 btn-gradient text-base shadow-sm'
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />{' '}
                    Speichere...
                  </>
                ) : (
                  <>
                    <Upload className='mr-2 h-4 w-4' /> Speichern
                  </>
                )}
              </Button>
            </div>

            <div className='grid grid-cols-2 gap-3 pt-2 border-t border-border/50'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    disabled={isDownloading}
                    className='w-full h-10'
                  >
                    {isDownloading ? (
                      <>
                        <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                        Wird erstellt...
                      </>
                    ) : (
                      <>
                        <Download className='mr-2 h-4 w-4' />
                        PDF Bericht
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='center'
                  className='bg-background p-2 rounded-md border border-border mt-1 shadow-md'
                >
                  <DropdownMenuItem
                    onClick={() => downloadPDF('all')}
                    className='cursor-pointer hover:bg-muted py-2 px-3 focus:bg-muted'
                  >
                    Alle Daten
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => downloadPDF('7')}
                    className='cursor-pointer hover:bg-muted py-2 px-3 focus:bg-muted'
                  >
                    Letzte 7 Tage
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => downloadPDF('30')}
                    className='cursor-pointer hover:bg-muted py-2 px-3 focus:bg-muted'
                  >
                    Letzte 30 Tage
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => downloadPDF('90')}
                    className='cursor-pointer hover:bg-muted py-2 px-3 focus:bg-muted'
                  >
                    Letzte 3 Monate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className='flex flex-col justify-end'>
                <Link href='/results' className='w-full'>
                  <Button
                    type='button'
                    variant='outline'
                    className='w-full h-10'
                  >
                    <List className='mr-2 h-4 w-4' />
                    Ergebnisse
                  </Button>
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
