import React, { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';

const BarcodeScanner = ({ open, onOpenChange, onBarcodeDetected }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [shouldStartScan, setShouldStartScan] = useState(false);
    const scannerRef = useRef(null);
    const html5QrCodeScannerRef = useRef(null); // Démarrer automatiquement le scanner quand le dialog s'ouvre
    useEffect(() => {
        if (open && !isScanning) {
            setIsScanning(true);
            setShouldStartScan(true);
        }
    }, [open, isScanning]); // Nettoyer le scanner quand le dialog se ferme
    useEffect(() => {
        if (!open && html5QrCodeScannerRef.current) {
            html5QrCodeScannerRef.current.clear().catch((error) => {
                console.error('Erreur lors de la fermeture du scanner:', error);
            });
            html5QrCodeScannerRef.current = null;
            setIsScanning(false);
            setShouldStartScan(false);
        }
    }, [open]); // Démarrer le scanner quand l'élément DOM est prêt
    useEffect(() => {
        if (shouldStartScan && isScanning) {
            const element = document.getElementById('barcode-scanner');
            if (element) {
                initializeScanner();
            }
        }
    }, [shouldStartScan, isScanning]); // Nettoyer le scanner au démontage du composant
    useEffect(() => {
        return () => {
            if (html5QrCodeScannerRef.current) {
                html5QrCodeScannerRef.current.clear().catch((error) => {
                    console.error(
                        'Erreur lors du nettoyage du scanner:',
                        error
                    );
                });
            }
        };
    }, []);

    const initializeScanner = async () => {
        try {
            // Configuration du scanner
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 125 },
                disableFlip: false,
            };

            // Fonction appelée lors de la détection réussie
            const onScanSuccess = (decodedText, decodedResult) => {
                console.log('Code détecté:', decodedText);

                // Vérifier si c'est un ISBN valide (code-barres EAN-13 ou ISBN)
                if (isValidISBN(decodedText)) {
                    onBarcodeDetected(decodedText);
                    stopScanning();
                    onOpenChange(false);
                    toast({
                        title: 'Code-barres détecté !',
                        description: `ISBN: ${decodedText}`,
                        variant: 'success',
                    });
                } else {
                    toast({
                        title: 'Code non reconnu',
                        description:
                            'Le code scanné ne semble pas être un ISBN valide.',
                        variant: 'destructive',
                    });
                }
            };

            // Fonction appelée en cas d'erreur de scan
            const onScanError = (errorMessage) => {
                if (errorMessage.includes('NotFoundException')) {
                    // Silencieusement ignorer
                    return;
                }
                console.log('Erreur de scan:', errorMessage);
            };

            // Créer et démarrer le scanner
            html5QrCodeScannerRef.current = new Html5QrcodeScanner(
                'barcode-scanner',
                config,
                false // verbose
            );

            html5QrCodeScannerRef.current.render(onScanSuccess, onScanError);
        } catch (error) {
            console.error('Erreur lors du démarrage du scanner:', error);
            setIsScanning(false);
            setShouldStartScan(false);
            toast({
                title: 'Erreur',
                description:
                    "Impossible d'accéder à la caméra. Vérifiez les permissions.",
                variant: 'destructive',
            });
        }
    };
    const stopScanning = async () => {
        if (html5QrCodeScannerRef.current) {
            try {
                await html5QrCodeScannerRef.current.clear();
                html5QrCodeScannerRef.current = null;
            } catch (error) {
                console.error("Erreur lors de l'arrêt du scanner:", error);
            }
        }
        setIsScanning(false);
        setShouldStartScan(false);
    };

    // Validation basique d'un ISBN
    const isValidISBN = (code) => {
        // Supprimer les tirets et espaces
        const cleanCode = code.replace(/[-\s]/g, '');

        // Vérifier si c'est un ISBN-10 ou ISBN-13
        if (cleanCode.length === 10 || cleanCode.length === 13) {
            return /^\d+$/.test(cleanCode) || /^\d+X$/i.test(cleanCode);
        }

        // Accepter aussi les codes EAN-13 qui commencent par 978 ou 979 (ISBN)
        if (
            cleanCode.length === 13 &&
            (cleanCode.startsWith('978') || cleanCode.startsWith('979'))
        ) {
            return /^\d+$/.test(cleanCode);
        }

        return false;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                {' '}
                <DialogHeader>
                    <DialogTitle className="main-title-text">
                        Scanner le code-barres
                    </DialogTitle>
                    <DialogDescription>
                        Placez le code-barres du livre dans le cadre pour le
                        scanner automatiquement.
                    </DialogDescription>
                </DialogHeader>{' '}
                <div className="space-y-4 pt-2">
                    <div className="space-y-4">
                        <div id="barcode-scanner" className="w-full"></div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Annuler
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BarcodeScanner;
