import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePermissions } from '@/hooks/use-permissions';
import { Camera, Shield, Clock, Activity, Bell, Smartphone, CheckCircle, AlertTriangle } from 'lucide-react';

interface PermissionRequestProps {
  onComplete: (allGranted: boolean) => void;
}

export function PermissionRequest({ onComplete }: PermissionRequestProps) {
  const { permissions, allGranted, isLoading, requestAllPermissions } = usePermissions();
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    // If all permissions are already granted, complete immediately
    if (allGranted && !hasRequested) {
      onComplete(true);
    }
  }, [allGranted, hasRequested, onComplete]);

  const handleRequestPermissions = async () => {
    setHasRequested(true);
    const result = await requestAllPermissions();
    onComplete(result.granted);
  };

  const getPermissionIcon = (permission: string, granted: boolean) => {
    const iconClass = granted ? 'text-green-600' : 'text-gray-400';
    
    switch (permission) {
      case 'camera':
        return <Camera className={`w-5 h-5 ${iconClass}`} />;
      case 'storage':
      case 'storageWrite':
      case 'mediaImages':
      case 'mediaVideo':
        return <Smartphone className={`w-5 h-5 ${iconClass}`} />;
      case 'activityRecognition':
        return <Activity className={`w-5 h-5 ${iconClass}`} />;
      case 'exactAlarm':
        return <Bell className={`w-5 h-5 ${iconClass}`} />;
      default:
        return <Shield className={`w-5 h-5 ${iconClass}`} />;
    }
  };

  const getPermissionTitle = (permission: string) => {
    switch (permission) {
      case 'camera':
        return 'Camera Access';
      case 'storage':
      case 'storageWrite':
        return 'Storage Access';
      case 'mediaImages':
        return 'Photo Access';
      case 'mediaVideo':
        return 'Video Access';
      case 'activityRecognition':
        return 'Activity Tracking';
      case 'exactAlarm':
        return 'Daily Reminders';
      default:
        return 'Permission';
    }
  };

  const getPermissionDescription = (permission: string) => {
    switch (permission) {
      case 'camera':
        return 'Scan nutrition labels with your camera';
      case 'storage':
      case 'storageWrite':
        return 'Save and access photos from your device';
      case 'mediaImages':
        return 'Access photos for nutrition analysis';
      case 'mediaVideo':
        return 'Access videos for nutrition analysis';
      case 'activityRecognition':
        return 'Track your daily steps and physical activity';
      case 'exactAlarm':
        return 'Send daily reminders and reset step counts';
      default:
        return 'Required for app functionality';
    }
  };

  const permissionItems = Object.entries(permissions).filter(([key]) => 
    !key.includes('Write') || permissions[key] // Only show storageWrite if it's relevant
  );

  if (allGranted) {
    return null; // Don't show if all permissions are granted
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-md mx-auto pt-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to NutriLens
          </h1>
          <p className="text-gray-600">
            We need some permissions to help you track your nutrition and health
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
            <h2 className="text-lg font-semibold">Permissions Required</h2>
          </div>
          
          <Alert className="mb-4">
            <AlertDescription>
              NutriLens needs the following permissions to provide you with the best experience:
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {permissionItems.map(([key, granted]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getPermissionIcon(key, granted)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {getPermissionTitle(key)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getPermissionDescription(key)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  {granted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      Required
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={handleRequestPermissions}
            disabled={isLoading || hasRequested}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3"
            size="lg"
          >
            {isLoading ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Requesting Permissions...
              </>
            ) : hasRequested ? (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Grant All Permissions
              </>
            )}
          </Button>

          <p className="text-center text-sm text-gray-500">
            You can manage these permissions later in your device settings
          </p>
        </div>
      </div>
    </div>
  );
}
