'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TemperatureRecord } from '@/types/temperature';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Search,
  Thermometer,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type SortField = 'temperature' | 'date' | 'time';
type SortDirection = 'asc' | 'desc';

export default function ResultsPage() {
  const [records, setRecords] = useState<TemperatureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );

  // Advanced table features
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const itemsPerPage = 12;

  useEffect(() => {
    fetchRecords();
  }, []);

  // Filtered and sorted records
  const processedRecords = useMemo(() => {
    const filtered = records.filter(
      (record) =>
        record.temperature.toString().includes(searchTerm) ||
        record.date.includes(searchTerm) ||
        record.time.includes(searchTerm)
    );

    filtered.sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];

      if (sortField === 'temperature') {
        aValue = a.temperature;
        bValue = b.temperature;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [records, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedRecords.length / itemsPerPage);
  const paginatedRecords = processedRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSortField('date');
    setSortDirection('desc');
    setCurrentPage(1);
  };

  const handleDeleteImage = async (recordId: string) => {
    setDeletingId(recordId);
    try {
      const response = await fetch('/api/delete-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recordId }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the records
        await fetchRecords();
        alert('Screenshot erfolgreich gelöscht');
      } else {
        alert(`Fehler beim Löschen: ${data.message}`);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Fehler beim Löschen des Screenshots');
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  };

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/temperature');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched data:', data);
        setRecords(data.records || []);
        console.log('Records set:', data.records || []);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const openSlideshow = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeSlideshow = useCallback(() => {
    setSelectedImageIndex(null);
  }, []);

  const nextImage = useCallback(() => {
    if (selectedImageIndex !== null) {
      const imagesWithScreenshots = records.filter((r) => r.screenshotUrl);
      const currentImageIndex = imagesWithScreenshots.findIndex(
        (r) => r.id === records[selectedImageIndex]?.id
      );
      const nextIndex = (currentImageIndex + 1) % imagesWithScreenshots.length;
      const nextRecordIndex = records.findIndex(
        (r) => r.id === imagesWithScreenshots[nextIndex]?.id
      );
      setSelectedImageIndex(nextRecordIndex);
    }
  }, [selectedImageIndex, records]);

  const prevImage = useCallback(() => {
    if (selectedImageIndex !== null) {
      const imagesWithScreenshots = records.filter((r) => r.screenshotUrl);
      const currentImageIndex = imagesWithScreenshots.findIndex(
        (r) => r.id === records[selectedImageIndex]?.id
      );
      const prevIndex =
        currentImageIndex === 0
          ? imagesWithScreenshots.length - 1
          : currentImageIndex - 1;
      const prevRecordIndex = records.findIndex(
        (r) => r.id === imagesWithScreenshots[prevIndex]?.id
      );
      setSelectedImageIndex(prevRecordIndex);
    }
  }, [selectedImageIndex, records]);

  const imagesWithScreenshots = records.filter((r) => r.screenshotUrl);
  const currentImageRecord =
    selectedImageIndex !== null ? records[selectedImageIndex] : null;

  // Keyboard navigation for slideshow
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;

      switch (e.key) {
        case 'Escape':
          closeSlideshow();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
      }
    };

    if (selectedImageIndex !== null) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [selectedImageIndex, nextImage, prevImage, closeSlideshow]);

  if (loading) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='container mx-auto px-4 py-6 max-w-6xl'>
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-4'>
              <div className='h-10 w-32 bg-muted rounded animate-pulse'></div>
              <div>
                <div className='h-8 w-64 bg-muted rounded animate-pulse mb-2'></div>
                <div className='h-4 w-48 bg-muted rounded animate-pulse'></div>
              </div>
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className='bg-card border rounded-xl overflow-hidden animate-pulse'
              >
                <div className='p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-2'>
                      <div className='h-4 w-4 bg-muted rounded'></div>
                      <div className='h-6 w-16 bg-muted rounded'></div>
                    </div>
                    <div className='flex items-center gap-1'>
                      <div className='h-3 w-3 bg-muted rounded'></div>
                      <div className='h-4 w-20 bg-muted rounded'></div>
                    </div>
                  </div>
                  <div className='aspect-video bg-muted rounded-lg'></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-6 max-w-6xl'>
        {/* Header */}
        <div className='flex flex-col gap-4 mb-6'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4'>
              <Link href='/'>
                <Button
                  variant='outline'
                  size='sm'
                  className='transition-all duration-200 hover:scale-105 w-fit'
                >
                  <ArrowLeft className='h-4 w-4 mr-2' />
                  <span className='hidden xs:inline'>Zurück zum Logger</span>
                  <span className='xs:hidden'>Zurück</span>
                </Button>
              </Link>
              <div className='min-w-0 flex-1'>
                <h1 className='text-xl sm:text-2xl font-bold truncate'>
                  Temperaturaufzeichnungen
                </h1>
                <p className='text-sm sm:text-base text-muted-foreground'>
                  {processedRecords.length} Gesamtaufzeichnungen •{' '}
                  {imagesWithScreenshots.length} mit Screenshots
                </p>
              </div>
            </div>
            <div className='flex justify-end'>
              <ThemeToggle />
            </div>
          </div>

          {/* Search and Filters */}
          {records.length > 0 && (
            <div className='flex flex-col gap-4 bg-card p-3 sm:p-4 rounded-lg border'>
              {/* Search Input */}
              <div className='relative w-full'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Suchen nach Temperatur, Datum oder Uhrzeit...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10 transition-all duration-200 focus:ring-2'
                />
              </div>

              {/* Filter Buttons */}
              <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
                <div className='flex gap-2 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0'>
                  <Button
                    variant={
                      sortField === 'temperature' ? 'default' : 'outline'
                    }
                    size='sm'
                    onClick={() => handleSort('temperature')}
                    className='transition-all duration-200 flex-shrink-0'
                  >
                    <Thermometer className='h-4 w-4 mr-1 sm:mr-2' />
                    <span className='hidden xs:inline'>Temperatur</span>
                    <span className='xs:hidden'>Temp</span>
                    {sortField === 'temperature' && (
                      <ArrowUpDown className='h-4 w-4 ml-1 sm:ml-2' />
                    )}
                  </Button>

                  <Button
                    variant={sortField === 'date' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => handleSort('date')}
                    className='transition-all duration-200 flex-shrink-0'
                  >
                    <Calendar className='h-4 w-4 mr-1 sm:mr-2' />
                    <span className='hidden xs:inline'>Datum</span>
                    <span className='xs:hidden'>Date</span>
                    {sortField === 'date' && (
                      <ArrowUpDown className='h-4 w-4 ml-1 sm:ml-2' />
                    )}
                  </Button>

                  <Button
                    variant={sortField === 'time' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => handleSort('time')}
                    className='transition-all duration-200 flex-shrink-0'
                  >
                    <span className='hidden xs:inline'>Uhrzeit</span>
                    <span className='xs:hidden'>Time</span>
                    {sortField === 'time' && (
                      <ArrowUpDown className='h-4 w-4 ml-1 sm:ml-2' />
                    )}
                  </Button>
                </div>

                {(searchTerm ||
                  sortField !== 'date' ||
                  sortDirection !== 'desc') && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={resetFilters}
                    className='transition-all duration-200 hover:bg-destructive/10 hover:text-destructive flex-shrink-0'
                  >
                    <span className='hidden sm:inline'>
                      Filter zurücksetzen
                    </span>
                    <span className='sm:hidden'>Reset</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Records Grid */}
        {records.length === 0 && (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6'>
              <Thermometer className='h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4' />
              <h3 className='text-base sm:text-lg font-semibold mb-2 text-center'>
                Keine Aufzeichnungen gefunden
              </h3>
              <p className='text-sm sm:text-base text-muted-foreground text-center mb-4 max-w-sm'>
                Beginnen Sie mit der Temperaturaufzeichnung, um Ihre Daten hier
                zu sehen.
              </p>
              <Link href='/'>
                <Button>
                  <Thermometer className='h-4 w-4 mr-2' />
                  Zum Temperatur Logger
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {records.length > 0 && processedRecords.length === 0 && (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6'>
              <Search className='h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4' />
              <h3 className='text-base sm:text-lg font-semibold mb-2 text-center'>
                Keine Ergebnisse gefunden
              </h3>
              <p className='text-sm sm:text-base text-muted-foreground text-center mb-4 max-w-sm'>
                Ihre Suche ergab keine Treffer. Versuchen Sie andere
                Suchbegriffe.
              </p>
              <Button variant='outline' onClick={resetFilters}>
                Filter zurücksetzen
              </Button>
            </CardContent>
          </Card>
        )}

        {records.length > 0 && processedRecords.length > 0 && (
          <>
            <div className='grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
              {paginatedRecords.map((record) => {
                const originalIndex = records.findIndex(
                  (r) => r.id === record.id
                );
                return (
                  <Card key={record.id} className='overflow-hidden'>
                    <CardHeader className='pb-2 sm:pb-3 px-4 sm:px-6'>
                      <div className='flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0'>
                        <div className='flex items-center gap-2'>
                          <Thermometer className='h-4 w-4 text-primary flex-shrink-0' />
                          <span className='font-semibold text-lg sm:text-xl'>
                            {record.temperature}°C
                          </span>
                        </div>
                        <div className='flex items-center gap-1 text-xs sm:text-sm text-muted-foreground'>
                          <Calendar className='h-3 w-3 flex-shrink-0' />
                          <span className='truncate'>
                            {record.date} {record.time}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='pt-0 px-4 sm:px-6 pb-4 sm:pb-6'>
                      {record.screenshotUrl ? (
                        <div
                          className='relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group transition-all duration-200 hover:scale-[1.02]'
                          onClick={() => openSlideshow(originalIndex)}
                        >
                          <Image
                            src={record.screenshotUrl}
                            alt={`Screenshot for ${record.temperature}°C on ${record.date}`}
                            fill
                            className='object-cover transition-transform group-hover:scale-105'
                          />
                          <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center'>
                            <ImageIcon className='h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                          </div>
                          <div className='absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs'>
                            {record.time}
                          </div>
                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(record.id);
                            }}
                            className='absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-2 sm:p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 touch-manipulation'
                            title='Screenshot löschen'
                          >
                            <Trash2 className='h-5 w-5 sm:h-4 sm:w-4' />
                          </button>
                        </div>
                      ) : (
                        <div className='aspect-square bg-muted rounded-lg flex items-center justify-center'>
                          <div className='text-center text-muted-foreground'>
                            <ImageIcon className='h-6 w-6 mx-auto mb-1' />
                            <span className='text-xs'>Kein Screenshot</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 sm:mt-8'>
                <div className='text-xs sm:text-sm text-muted-foreground text-center sm:text-left'>
                  <span className='hidden xs:inline'>
                    Zeige{' '}
                    {Math.min(
                      (currentPage - 1) * itemsPerPage + 1,
                      processedRecords.length
                    )}{' '}
                    bis{' '}
                    {Math.min(
                      currentPage * itemsPerPage,
                      processedRecords.length
                    )}{' '}
                    von {processedRecords.length} Ergebnissen
                  </span>
                  <span className='xs:hidden'>
                    {currentPage} / {totalPages} Seiten
                  </span>
                </div>

                <div className='flex items-center gap-1 sm:gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className='transition-all duration-200 px-2 sm:px-3'
                  >
                    <ChevronLeft className='h-4 w-4 sm:mr-1' />
                    <span className='hidden xs:inline'>Vorherige</span>
                  </Button>

                  <div className='flex items-center gap-1'>
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      const pageNum =
                        Math.max(1, Math.min(totalPages - 2, currentPage - 1)) +
                        i;
                      if (pageNum > totalPages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pageNum === currentPage ? 'default' : 'outline'
                          }
                          size='sm'
                          onClick={() => setCurrentPage(pageNum)}
                          className='w-8 h-8 sm:w-10 sm:h-10 transition-all duration-200 text-xs sm:text-sm'
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className='transition-all duration-200 px-2 sm:px-3'
                  >
                    <span className='hidden xs:inline'>Nächste</span>
                    <ChevronRight className='h-4 w-4 sm:ml-1' />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Slideshow Modal */}
        {selectedImageIndex !== null && currentImageRecord?.screenshotUrl && (
          <div className='fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4'>
            <div className='relative max-w-4xl max-h-full'>
              {/* Close Button */}
              <button
                onClick={closeSlideshow}
                className='absolute -top-12 right-0 text-white hover:text-gray-300 text-xl font-bold'
                title='Schließen (Esc)'
              >
                ✕
              </button>

              {/* Keyboard Instructions */}
              <div className='absolute -top-12 left-0 text-white/70 text-sm'>
                Verwende ← → Tasten zum Navigieren, Esc zum Schließen
              </div>

              {/* Navigation Buttons */}
              {imagesWithScreenshots.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className='absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 text-3xl font-bold bg-black/50 rounded-full w-12 h-12 flex items-center justify-center'
                    title='Vorheriges Bild (←)'
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextImage}
                    className='absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 text-3xl font-bold bg-black/50 rounded-full w-12 h-12 flex items-center justify-center'
                    title='Nächstes Bild (→)'
                  >
                    ›
                  </button>
                </>
              )}

              {/* Main Image */}
              <div className='relative'>
                <Image
                  src={currentImageRecord.screenshotUrl}
                  alt={`Screenshot for ${currentImageRecord.temperature}°C`}
                  width={800}
                  height={600}
                  className='max-w-full max-h-[80vh] object-contain rounded-lg'
                />

                {/* Temperature and Date Overlay */}
                <div className='absolute bottom-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Thermometer className='h-4 w-4' />
                    <span className='font-semibold text-lg'>
                      {currentImageRecord.temperature}°C
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4' />
                    <span>
                      {currentImageRecord.date} at {currentImageRecord.time}
                    </span>
                  </div>
                </div>

                {/* Image Counter */}
                {imagesWithScreenshots.length > 1 && (
                  <div className='absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded text-sm'>
                    {imagesWithScreenshots.findIndex(
                      (r) => r.id === currentImageRecord.id
                    ) + 1}{' '}
                    / {imagesWithScreenshots.length}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
            <div className='bg-background border rounded-lg shadow-lg max-w-sm sm:max-w-md w-full mx-4'>
              <div className='p-4 sm:p-6'>
                <div className='flex items-start gap-3 mb-4'>
                  <div className='flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center'>
                    <AlertTriangle className='h-5 w-5 text-red-600 dark:text-red-400' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <h3 className='text-base sm:text-lg font-semibold'>
                      Screenshot löschen?
                    </h3>
                    <p className='text-sm text-muted-foreground mt-1'>
                      Diese Aktion kann nicht rückgängig gemacht werden. Der
                      Screenshot wird dauerhaft gelöscht.
                    </p>
                  </div>
                </div>

                <div className='flex flex-col-reverse sm:flex-row gap-3 sm:justify-end'>
                  <Button
                    variant='outline'
                    onClick={() => setShowDeleteConfirm(null)}
                    disabled={deletingId !== null}
                    className='w-full sm:w-auto'
                  >
                    Abbrechen
                  </Button>
                  <Button
                    variant='destructive'
                    onClick={() => handleDeleteImage(showDeleteConfirm)}
                    disabled={deletingId !== null}
                    className='w-full sm:w-auto sm:min-w-[100px]'
                  >
                    {deletingId === showDeleteConfirm ? (
                      <>
                        <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                        Löschen...
                      </>
                    ) : (
                      'Löschen'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
