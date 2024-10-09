import myw from 'myWorld-client'; //module that allows access to layout definitions and list of plugins
import '../../../workflow_manager_dev_db/public/js/main.nmt-wfm'; //NMT application definition file, we are extending it
import ToolsModePlugin from '../../../comms/public/js/modes/toolsModePlugin'; //Palette plugin
import { FieldValidatorPlugin } from './FieldValidator/fieldValidatorPlugin'; //Our tool plugin

myw.localisation.loadModuleLocale('custom');

// const desktopLayoutDef = myw.applicationDefinition.layouts.desktop; //Application's desktop layout definition
// const plugins = myw.applicationDefinition.plugins; //this is the application's list of plugins
// const desktopToolbarButtons = desktopLayoutDef.controls.toolbar[1].buttons; //This is the list of buttons in the application's top toolbar

// plugins['fieldValidatorPlugin'] = FieldValidatorPlugin; //Adding the newly created plugin to the application's list of plugins
// plugins['fieldValidatorPalette'] = [
//     //Adding the Tools Mode Plugin to the application's list of plugins, including the array of buttons
//     ToolsModePlugin,
//     {
//         toolButtons: ['fieldValidatorPlugin.dialog']
//     }
// ];

// desktopToolbarButtons.push('fieldValidatorPlugin.dialog'); //Adding the Field Validator button to the application's top toolbar
// desktopToolbarButtons.push('fieldValidatorPalette.toggle'); //Adding the Palette button to the application's top toolbar
