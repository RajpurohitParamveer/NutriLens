import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Search,
  Grid,
  List,
  Camera,
  TrendingUp,
  CalendarIcon,
  SortAsc,
  Trash2,
  X,
} from "lucide-react";
import { useScans, SortOption, FilterOption, Scan } from "@/hooks/use-scans";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function History() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const { scans, loading, deleteScan, clearHistory } = useScans({
    searchQuery,
    sortBy,
    filterBy,
    startDate,
    endDate,
  });

  const handleDeleteScan = async (scanId: string) => {
    const { error } = await deleteScan(scanId);
    if (error) {
      toast({
        title: t('history.deleteFailed'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('history.scanDeleted'),
        description: t('history.scanDeletedDesc'),
      });
    }
  };

  const handleClearHistory = async () => {
    const { error } = await clearHistory();
    if (error) {
      toast({
        title: t('history.clearFailed'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('history.historyCleared'),
        description: t('history.historyClearedDesc'),
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("date-desc");
    setFilterBy("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const hasActiveFilters = searchQuery || filterBy !== "all" || startDate || endDate || sortBy !== "date-desc";

  // Statistics
  const stats = useMemo(() => {
    const healthy = scans.filter((s) => s.health_rating === "healthy").length;
    const moderate = scans.filter((s) => s.health_rating === "moderate").length;
    const unhealthy = scans.filter((s) => s.health_rating === "unhealthy").length;
    return { healthy, moderate, unhealthy, total: scans.length };
  }, [scans]);

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border safe-top">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-semibold text-foreground">{t('history.title')}</h1>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9",
                viewMode === "list" ? "text-primary" : "text-muted-foreground"
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9",
                viewMode === "grid" ? "text-primary" : "text-muted-foreground"
              )}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('history.searchPlaceholder')}
            className="pl-9 h-10 bg-card border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-2">
          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[140px] h-9 bg-card">
              <SortAsc className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('history.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">{t('history.newestFirst')}</SelectItem>
              <SelectItem value="date-asc">{t('history.oldestFirst')}</SelectItem>
              <SelectItem value="score-desc">{t('history.highestScore')}</SelectItem>
              <SelectItem value="score-asc">{t('history.lowestScore')}</SelectItem>
              <SelectItem value="name-asc">{t('history.nameAZ')}</SelectItem>
              <SelectItem value="name-desc">{t('history.nameZA')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Health Filter */}
          <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
            <SelectTrigger className="w-[130px] h-9 bg-card">
              <SelectValue placeholder={t('history.filter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('history.allRatings')}</SelectItem>
              <SelectItem value="healthy">{t('history.healthy')}</SelectItem>
              <SelectItem value="moderate">{t('history.moderate')}</SelectItem>
              <SelectItem value="unhealthy">{t('history.unhealthy')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 bg-card">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {startDate || endDate
                  ? `${startDate ? format(startDate, "MMM d") : "Start"} - ${endDate ? format(endDate, "MMM d") : "End"}`
                  : t('history.dateRange')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">{t('history.startDate')}</p>
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">{t('history.endDate')}</p>
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => (startDate ? date < startDate : false)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                >
                  {t('history.clearDates')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-9" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Stats Summary */}
        {!loading && scans.length > 0 && (
          <div className="flex gap-2 text-sm">
            <Badge variant="outline" className="bg-healthy/10 text-healthy border-healthy/20">
              {stats.healthy} {t('history.healthy')}
            </Badge>
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
              {stats.moderate} {t('history.moderate')}
            </Badge>
            <Badge variant="outline" className="bg-unhealthy/10 text-unhealthy border-unhealthy/20">
              {stats.unhealthy} {t('history.unhealthy')}
            </Badge>
          </div>
        )}

        {/* Clear History Button */}
        {!loading && scans.length > 0 && (
          <div className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('history.clearHistory')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('history.clearAllHistory')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('history.clearAllHistoryDesc')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t('history.deleteAll')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 bg-card border-border">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-14 h-14 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && scans.length === 0 && (
          <Card className="p-8 bg-card border-border flex flex-col items-center text-center mt-8">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <TrendingUp className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              {hasActiveFilters ? t('history.noMatchingScans') : t('history.noScanHistory')}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {hasActiveFilters
                ? t('history.tryAdjustingFilters')
                : t('history.yourScansWillAppear')}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                {t('history.clearFilters')}
              </Button>
            ) : (
              <Button
                className="gradient-primary shadow-primary"
                onClick={() => navigate("/scan")}
              >
                <Camera className="w-4 h-4 mr-2" />
                {t('history.startScanning')}
              </Button>
            )}
          </Card>
        )}

        {/* Scans List */}
        {!loading && scans.length > 0 && (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"
            }
          >
            {scans.map((scan) => (
              <ScanCard
                key={scan.id}
                scan={scan}
                viewMode={viewMode}
                onClick={() => navigate(`/results/${scan.id}`)}
                onDelete={() => handleDeleteScan(scan.id)}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function ScanCard({
  scan,
  viewMode,
  onClick,
  onDelete,
  t,
}: {
  scan: Scan;
  viewMode: "grid" | "list";
  onClick: () => void;
  onDelete: () => void;
  t: (key: string) => string;
}) {
  const healthColor = {
    healthy: "bg-healthy/10 text-healthy border-healthy/20",
    moderate: "bg-accent/10 text-accent border-accent/20",
    unhealthy: "bg-unhealthy/10 text-unhealthy border-unhealthy/20",
  };

  const ratingClass = scan.health_rating
    ? healthColor[scan.health_rating]
    : "bg-muted text-muted-foreground";

  if (viewMode === "grid") {
    return (
      <Card
        className="p-3 bg-card border-border cursor-pointer hover:border-primary/50 transition-colors relative group"
        onClick={onClick}
      >
        <div className="w-full aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
          {scan.image_url ? (
            <img
              src={scan.image_url}
              alt={scan.product_name || t('history.unknownProduct')}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Badge className={cn("text-xs", ratingClass)} variant="outline">
            {scan.health_score ?? "N/A"}
          </Badge>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('history.deleteScanTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('history.deleteScanDesc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <p className="text-sm font-medium text-foreground mt-1 truncate">
          {scan.product_name || t('history.unknownProduct')}
        </p>
        <p className="text-xs text-muted-foreground">
          {scan.created_at && !isNaN(new Date(scan.created_at).getTime())
            ? format(new Date(scan.created_at), "MMM d, yyyy")
            : t('history.unknownDate')}
        </p>
      </Card>
    );
  }

  return (
    <Card
      className="p-4 bg-card border-border cursor-pointer hover:border-primary/50 transition-colors group"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
          {scan.image_url ? (
            <img
              src={scan.image_url}
              alt={scan.product_name || t('history.unknownProduct')}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">
            {scan.product_name || t('history.unknownProduct')}
          </p>
          <p className="text-sm text-muted-foreground">
            {scan.created_at && !isNaN(new Date(scan.created_at).getTime())
              ? format(new Date(scan.created_at), "MMM d, yyyy 'at' h:mm a")
              : t('history.unknownDate')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn(ratingClass)} variant="outline">
            {scan.health_score ?? "N/A"}
          </Badge>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('history.deleteScanTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('history.deleteScanDesc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}