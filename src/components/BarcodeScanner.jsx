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

    // Fonction pour personnaliser le texte des éléments UI
    const customizeUIText = () => {
        const scannerElement = document.getElementById('barcode-scanner');
        if (!scannerElement) return;

        // Masquer le bouton d'information "Powered by ScanApp" et tout contenu dans les divs absolus
        const infoElements = scannerElement.querySelectorAll(
            'div[style*="position: absolute"], img[style*="position: absolute"]'
        );
        infoElements.forEach((element) => {
            const style = element.getAttribute('style') || '';
            if (
                style.includes('position: absolute') &&
                style.includes('top') &&
                style.includes('right')
            ) {
                element.style.display = 'none';
                element.style.visibility = 'hidden';
                element.style.opacity = '0';
                // Masquer aussi tous les enfants
                const children = element.querySelectorAll('*');
                children.forEach((child) => {
                    child.style.display = 'none';
                });
            }
        });

        // Personnaliser le bouton "Request Permission"
        const permissionButtons = scannerElement.querySelectorAll('button');
        permissionButtons.forEach((button) => {
            if (
                button.textContent.includes('Request Camera Permissions') ||
                button.textContent.includes('Request Permission')
            ) {
                button.textContent = '📷 Autoriser la caméra';
            }
            if (button.textContent.includes('Start Scanning')) {
                button.textContent = '🚀 Démarrer le scan';
            }
            if (button.textContent.includes('Stop Scanning')) {
                button.textContent = '⏹️ Arrêter le scan';
            }
        });

        // Personnaliser le label du select de caméra
        const spans = scannerElement.querySelectorAll('span');
        spans.forEach((span) => {
            if (
                span.textContent.includes('Select Camera') ||
                span.textContent.includes('Choose Camera')
            ) {
                // Remplacer uniquement le premier nœud texte sans supprimer les enfants (ex: select)
                const firstChild = span.firstChild;
                if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
                    firstChild.textContent = '📷 Sélectionner une caméra :';
                }
            }
        });

        // Personnaliser l'alignement de l'icone au premier lancement
        const firstLaunchImg = scannerElement.querySelectorAll(
            'img[alt="Camera based scan"]'
        );
        if (firstLaunchImg) {
            firstLaunchImg.forEach((element) => {
                element.style.display = 'inline-block';
                if (document.documentElement.classList.contains('dark')) {
                    element.style.filter = 'invert(1)';
                } else {
                    element.style.filter = '';
                }
            });
        }

        // Personnaliser l'alignement de l'icone au premier lancement
        const fileScanImg = scannerElement.querySelectorAll(
            'img[alt="Fule based scan"]'
        );
        if (fileScanImg) {
            fileScanImg.forEach((element) => {
                element.style.display = 'none';
            });
        }

        // Personnaliser le texte de changement de type de scan
        const changeScanTypeText = document.getElementById(
            'html5-qrcode-anchor-scan-type-change'
        );
        if (changeScanTypeText && changeScanTypeText.textContent) {
            if (changeScanTypeText.textContent.includes('Scan an Image File')) {
                changeScanTypeText.textContent = 'Scanner un fichier';
            }
            if (
                changeScanTypeText.textContent.includes(
                    'Scan using camera directly'
                )
            ) {
                changeScanTypeText.textContent = 'Scanner avec la caméra';
            }
        }

        const fileSelectionButton = document.getElementById(
            'html5-qrcode-button-file-selection'
        );
        if (fileSelectionButton && fileSelectionButton.textContent) {
            if (
                fileSelectionButton.textContent.includes(
                    'Choose Image - No image choosen'
                )
            ) {
                fileSelectionButton.textContent = '🖼️ Choisir une image';
            }
        }

        const divsInScanner = scannerElement.querySelectorAll(
            'div[style*="font-weight: 400"]'
        );
        if (divsInScanner) {
            divsInScanner.forEach((element) => {
                const textContent = element.textContent || '';
                if (textContent.includes('Or drop an image to scan')) {
                    element.innerText = 'Ou déposer une image pour scanner';
                    element.style.fontWeight = '100';
                    element.style.fontSize = '14px';
                }
            });
        }

        const scannerScanRegion = document.getElementById(
            'barcode-scanner__scan_region'
        );
        if (scannerScanRegion && scannerScanRegion.style) {
            scannerScanRegion.style.minHeight = null; // Enlever la hauteur minimale pour éviter les problèmes de mise en page
        }

        // Observer les changements pour mettre à jour le texte dynamiquement
        const observer = new MutationObserver(() => {
            // Debounce pour éviter les appels récursifs et les freezes
            if (observer.debounceTimeout)
                clearTimeout(observer.debounceTimeout);
            observer.debounceTimeout = setTimeout(() => {
                customizeUIText();
            }, 100);
        });

        observer.observe(scannerElement, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        // Nettoyer l'observer quand le scanner est fermé
        setTimeout(() => {
            if (!document.getElementById('barcode-scanner')) {
                observer.disconnect();
            }
        }, 100);
    };

    // Fonction pour initialiser le scanner
    const initializeScanner = async () => {
        try {
            // Injecter les styles personnalisés pour la librairie html5-qrcode
            const customStyles = `
                <style>
                    /* Styles pour les boutons */
                    #barcode-scanner button {
                        background: hsl(var(--primary)) !important;
                        color: hsl(var(--primary-foreground)) !important;
                        border: 1px solid hsl(var(--border)) !important;
                        border-radius: 6px !important;
                        padding: 8px 16px !important;
                        font-size: 14px !important;
                        font-weight: 500 !important;
                        cursor: pointer !important;
                        transition: all 0.2s !important;
                        margin: 4px !important;
                    }

                    #barcode-scanner button:hover {
                        background: hsl(var(--primary)/0.9) !important;
                    }

                    /* Style pour le select de caméra */
                    #barcode-scanner select {
                        background: hsl(var(--background)) !important;
                        border: 1px solid hsl(var(--border)) !important;
                        border-radius: 6px !important;
                        padding: 8px 12px !important;
                        font-size: 14px !important;
                        color: hsl(var(--foreground)) !important;
                        margin: 8px !important;
                        cursor: pointer !important;
                    }

                    /* Styles pour les labels et texte */
                    #barcode-scanner span {
                        color: hsl(var(--foreground)) !important;
                        font-size: 14px !important;
                        margin: 4px 0 !important;
                    }

                    /* Container principal */
                    #barcode-scanner > div {
                        text-align: center !important;
                        margin: 8px 0 !important;
                        display: block !important;
                        visibility: visible !important;
                    }

                    /* Zone de scan vidéo */
                    #barcode-scanner video {
                        border-radius: 8px !important;
                        max-width: 100% !important;
                    }

                    /* Canvas overlay */
                    #barcode-scanner canvas {
                        border-radius: 8px !important;
                    }
                </style>
            `;

            // Injecter les styles dans le head si pas déjà fait
            if (!document.getElementById('barcode-scanner-styles')) {
                const styleElement = document.createElement('div');
                styleElement.id = 'barcode-scanner-styles';
                styleElement.innerHTML = customStyles;
                document.head.appendChild(styleElement);
            }

            // Configuration du scanner
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 125 },
                disableFlip: false,
            };

            // Fonction appelée lors de la détection réussie
            const onScanSuccess = (decodedText, decodedResult) => {
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
                        title: `Code non reconnu : ${decodedText}`,
                        description:
                            'Le code scanné ne semble pas être un ISBN valide. Veuillez réessayer.',
                        //variant: 'destructive',
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

            customizeUIText();
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

    // Fonction pour arrêter le scanner
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

    // Fonction pour valider les codes ISBN
    const isValidISBN = (code) => {
        // Supprimer les tirets et espaces
        const cleanCode = code.replace(/[-\s]/g, '');

        // ISBN-10 : 10 chiffres, ou 9 chiffres + X
        if (cleanCode.length === 10) {
            return /^\d{9}[\dX]$/i.test(cleanCode);
        }

        // ISBN-13 : commence par 978 ou 979 + 10 chiffres, checksum facultatif ici
        if (cleanCode.length === 13) {
            return /^(978|979)\d{10}$/.test(cleanCode);
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
