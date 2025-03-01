import type { CastReceiverContext } from "chromecast-caf-receiver/cast.framework";
import type { Resolution } from "./codecSupportHelper";
import type { defaultClientConditions } from "vite";

/**
 * Represents an individual codec profile
 * @property {string} flag - The flag of the codec profile for cast SDK.
 */
export interface CodecProfile{
    /*public id: string;*/
    public flag: string;
}

/**
 * Represents a video codec profile.
 * @extends CodecProfile
 * @property {number} constraintFlag - The constraint flag of the codec profile for cast SDK (e.g. for HEVC).
 */
export interface VideoProfile extends CodecProfile{
    public constraintFlag: number | undefined;
    public bitDepth: number | undefined;
    public bitDepthFlag: string | undefined;
}

/**
    * Represents a video codec profile.
 * @extends CodecProfile
 * @property { number } channelCount - The number of channels in the audio codec profile.
 */
export interface AudioProfile extends CodecProfile{
    public supportsSurround: boolean;
    public passthroughSupported: boolean;
}

/**
 * Represents an audio or video codec.
 * This class provides a common interface for audio and video codecs which are implemented as subclasses.



 * @method getMediaTypeString - Returns the media type string for cast SDK.
 * @method defaultConfiguration - Returns the default configuration for the codec.
 */
export abstract class Codec {
    
    //Static members
    
    public static readonly availableProfiles: Record<string, CodecProfile>;
    public abstract static defaultConfiguration(): Codec;
    public static hasProfile(profile: CodecProfile): boolean {
        return Object.values(this.availableProfiles).includes(profile);
    }

    //Instance members
    public abstract readonly profile: CodecProfile;
    public abstract getMediaTypeString(): string;
}

/** Implementation of Codec as VideoCodec
 * @extends Codec
 * @property {VideoProfile} profile - The selected profile of the video codec instance.
 * @property {Record<string, VideoProfile>} availableProfiles - The available profiles for the video codec.
 */
export abstract class VideoCodec extends Codec{
    constructor(level: number, profile: VideoProfile) {
        super()
        if (VideoCodec.availableLevels.includes(level) && VideoCodec.hasProfile(profile)) {
            this.level = level;
            this.profile = profile;
        } else {
            throw new Error("Invalid level for video codec");
        }
    }
    public static abstract readonly availableLevels: Array<number>;
    public static abstract readonly availableProfiles: Record<string, VideoProfile>;

    public level: number;
    public profile: VideoProfile;
}

/** Implementation of Codec as AudioCodec
 * @extends Codec
 * @property {AudioProfile} profile - The selected profile of the audio codec instance.
 * @property {Record<string, AudioProfile>} availableProfiles - The available profiles for the audio codec.
 */
export abstract class AudioCodec extends Codec{
    constructor(profile: AudioProfile) {
        super();
        if (AudioCodec.hasProfile(profile)) {
            this.profile = profile;
        } else {
            throw new Error("Invalid profile for audio codec");
        }
    }
    public profile: AudioProfile;
    public static readonly availableProfiles: Record<string, AudioProfile>;
}


/*
*Video Codec Definitinos
/*

/**
 * The H265/HEVC video codec.
 * Defaults to level 5 and main profile.
 * @extends VideoCodec
 * @property {Array<number>} availableLevels - The available levels for the H265 codec.
 * @property {Array<VideoProfile>} availableProfiles - The available profiles for the H265 codec.
 * @method defaultConfiguration - Returns the default configuration for the H265 codec.
 * @method getMediaTypeString - Returns the media type string for cast SDK.
 */
export class H265 extends VideoCodec {
    public static readonly availableLevels = [1,2,2.1,3,3.1,4,4.1,5,5.1,5.2,6,6.1,6.2];
    public static readonly availableProfiles: Record<string, VideoProfile> = {
        main:   { flag: "L", bitDepth: undefined, bitDepthFlag: undefined, constraintFlag: 0 },
        main10: { flag: "L", bitDepth: undefined, bitDepthFlag: undefined, constraintFlag: 4 },
        high:   { flag: "H", bitDepth: undefined, bitDepthFlag: undefined, constraintFlag: 4 },
        high10: { flag: "H", bitDepth: undefined, bitDepthFlag: undefined, constraintFlag: 4 }
    }

    public static defaultConfiguration(): H265 {
        return new H265(
            5,
            this.availableProfiles.main
        )
    }

    public getMediaTypeString(): string {
        return `"hev1.1.${this.profile.constraintFlag}.${this.profile.flag}${this.level * 30}.B0"`; //e.g. 'hev1.1.0.L300.B0'
    }
}

export class H264 extends VideoCodec {

}

export class AV1 extends VideoCodec {
}

/*
*Audio Codec Definitions
*/
export class MP4A extends AudioCodec {
    public static availableProfiles: Record<string, AudioProfile> = {
        LCAAC:  { flag: "mp4a.40.2",     supportsSurround: true, passthroughSupported: true },
        HEAAC:  { flag: "mp4a.40.5",     supportsSurround: true, passthroughSupported: true },
        HEAAC2: { flag: "mp4a.40.5.2",   supportsSurround: true, passthroughSupported: true },
        EAC3:   { flag: "ec-3",          supportsSurround: true, passthroughSupported: true },
        MPEGH:  { flag: "mp4a.40.5.2",   supportsSurround: true, passthroughSupported: true },
        ATMOS:  { flag: "ec-3",          supportsSurround: true, passthroughSupported: true } //Need to also check IS_DOLBY_ATMOS_SUPPORTED flag
    }

    public static defaultConfiguration(): MP4A {
        return new MP4A(
            this.availableProfiles.LCAAC
        )
    }

    public getMediaTypeString(): string {
        return `"${this.profile.flag}"`+ (this.profile)
    }

}



export interface MediaContainer {
    public static mimeType: string;
    public static jellyfinContainerName: string;
    public static supportedVideoCodecs: Array<VideoCodec>;
}

export static class MP4 implements MediaContainer {
    mimeType: string = "video/mp4";
    jellyfinContainerName: string = ;
    supportedVideoCodecs: [H264, H265, AV1];
}

export static class WebM implements MediaContainer {
    public static jellyfinContainerName: string;
    public static supportedVideoCodecs: VideoCodec[];
    public mimeType: string = "video/webm";
}

export static class MKV implements MediaContainer {
    public static jellyfinContainerName: string;
    public static supportedVideoCodecs: VideoCodec[];
    public mimeType: string = "video/x-matroska";
}



export const codecs = [H265];
export const containers = [MP4];
/**
 * Represents a media configuration.
 * @property {MediaContainer} container - The container.
 *  @property {VideoCodec} videoCodec - The video codec.
 * @property {Resolution} resolution - The resolution of the video.
 * @property {AudioCodec} audioCodec - The audio codec.
 * @method getSupportedMediaConfigurations - Returns an array of supported media configurations based on the codecs and containers supported by the device.
 *  
 */
export class MediaProfile {

    //Static members
    /**
     * Returns an array of supported media configurations based on the codecs and containers supported by the device.
     * @param {ContextManager} contextManager - The context manager to use to determine the capabilities of the device.
     * @param {boolean} requireVideo - Whether the media configuration should include video.
     * @param {boolean} requireAudio - Whether the media configuration should include audio.
     * @returns {array<[string,string]>} - A list of supported media configuration identifiers as an array of tuples - i.e. [container, codec].
     */

    //Static members
    public static getSupportedMediaConfigurations(
        castContext: CastReceiverContext,
        requireVideo: boolean,
        requireAudio: boolean
    ): Array<MediaProfile> {
        for (let container of containers) {
            //First check audio only configurations


            //Then check video only configurations


            //Then check combinations of audio and video configurations
        }
    }

    //Instance members
    constructor(container: MediaContainer, videoCodec?: VideoCodec, resolution?: Resolution, audioCodec?: AudioCodec) {

        if (videoCodec == undefined && audioCodec == undefined) {
            throw new Error("At least one of videoCodec or audioCodec must be defined");
        }

        this.container = container;
    }

    public container: MediaContainer;
    public codecs: Array<Codec>;
    public castMediaTypeString: string;

    /**
     * Returns the full media type string for cast SDK including the mime-type and codec strings.
     * @returns {string} - The media type string.
     */
    public getMediaTypeString(): string {
        let mediaTypeString = this.container.mimeType + "; codecs=";
        if (this.videoCodec != undefined) {
            mediaTypeString += this.videoCodec.getMediaTypeString();
        }
        if (this.videoCodec != undefined && this.audioCodec != undefined) {
            mediaTypeString += ", ";
        }
        if (this.audioCodec != undefined) {
            mediaTypeString += this.audioCodec.getMediaTypeString();
        }
        mediaTypeString += "\"";

        return mediaTypeString;
    }


    

}

/*************Codec Definitions*****************/


export interface StreamContainerProfile{
    public static name: string;
    public static supportedCodecs: Array<Codec>;
}





