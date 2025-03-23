import { createAvatar } from '@dicebear/core';
import { identicon, bottts, micah, avataaars, lorelei } from '@dicebear/collection';
import { AvatarStyle } from '../types';

export const formatWalletAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const generateAvatar = async (walletAddress: string, style: AvatarStyle = 'identicon'): Promise<string> => {
    let avatar;
    
    switch (style) {
        case 'identicon':
            avatar = createAvatar(identicon, {
                seed: walletAddress,
                backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
            });
            break;
        case 'bottts':
            avatar = createAvatar(bottts, {
                seed: walletAddress,
                backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
            });
            break;
        case 'micah':
            avatar = createAvatar(micah, {
                seed: walletAddress,
                backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc'],
            });
            break;
        case 'avataaars':
            avatar = createAvatar(avataaars, {
                seed: walletAddress,
                backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9'],
            });
            break;
        case 'lorelei':
            avatar = createAvatar(lorelei, {
                seed: walletAddress
            });
            break;
        default:
            avatar = createAvatar(identicon, {
                seed: walletAddress
            });
    }
    
    return avatar.toDataUri();
}; 