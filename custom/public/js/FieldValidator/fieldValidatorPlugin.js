//Plugin: class to create new optional components, PluginButton: class to create new buttons that activate plugins
import { Plugin, PluginButton } from 'myWorld-client';
import { renderReactNode } from 'myWorld-client/react'; //createRoot wrapper function
import customRulesImage from '../../images/fieldValidator.svg';
import { FieldValidatorModal } from './fieldValidatorModal';

export class FieldValidatorPlugin extends Plugin {
    static {
        this.prototype.messageGroup = 'fieldValidatorPlugin'; //Localisation message group

        this.prototype.buttons = {
            dialog: class extends PluginButton {
                static {
                    this.prototype.id = 'cable-capture-button';
                    this.prototype.titleMsg = 'fieldValidatorPluginTitle'; //Localisation title message key
                    this.prototype.imgSrc = customRulesImage; //Icon image source
                }

                action() {
                    this.owner.showModal(); //Show the modal window
                }
            }
        };
    }

    constructor(owner, options) {
        super(owner, options);
    }

    showModal() {
        //renderReactNode is a createRoot wrapper, parameters are:
        //- the DOM element
        //- the react component to render
        //- the props to pass to the component
        //- the root element to render the component
        this.renderRoot = renderReactNode(
            null,
            FieldValidatorModal,
            {
                open: true
            },
            this.renderRoot
        );
    }
}
