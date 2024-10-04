import { Plugin, PluginButton } from 'myWorld-client';
import { renderReactNode } from 'myWorld-client/react';
import customRulesImage from '../../images/fieldValidator.svg';
import { FieldValidatorModal } from './fieldValidatorModal';

export class FieldValidatorPlugin extends Plugin {
    static {
        this.prototype.messageGroup = 'customRulePlugin'; //Localisation message group

        this.prototype.buttons = {
            dialog: class extends PluginButton {
                static {
                    this.prototype.id = 'cable-capture-button';
                    this.prototype.titleMsg = 'customRulePlugin'; //Localisation title message key
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
